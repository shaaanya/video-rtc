import { useEffect, useRef, useState } from "react";
import "./ui.css";
import { SignalingClient, type Message } from "./ws";
import { WebRTCManager } from "./webrtc";

function App() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const [roomID, setRoomID] = useState("");
  const [inCall, setInCall] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<SignalingClient | null>(null);
  const rtcRef = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    // Check URL for room
    const params = new URLSearchParams(window.location.search);
    const r = params.get("r");
    if (r) {
      setRoomID(r);
    } else {
      // Fetch config to get auto room ID
      fetch("/config")
        .then((res) => res.json())
        .then((data) => {
          if (!roomID) setRoomID(data.autoRoomId);
        })
        .catch(console.error);
    }
  }, []);

  const requestPermissions = async () => {
    if (permissionsGranted || isRequestingPermissions) return true;

    setIsRequestingPermissions(true);
    setStatus("Requesting camera and microphone access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      // Immediately stop the preview stream; we'll re-request when joining the room.
      stream.getTracks().forEach((t) => t.stop());

      setPermissionsGranted(true);
      setStatus("✅ Camera and microphone ready!");
      setIsRequestingPermissions(false);
      return true;
    } catch (e: any) {
      console.error("Error accessing media devices:", e);

      let errorMsg = "Failed to access camera/microphone: ";

      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        if (isIOS && isSafari) {
          errorMsg +=
            "Safari blocked access. Tap the 'AA' icon -> Website Settings -> set Camera and Microphone to Allow, then reload the page.";
        } else {
          errorMsg += "Permission denied. Please click 'Allow' when your browser asks for access.";
        }
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        errorMsg += "No camera or microphone found. Please check your device.";
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        errorMsg += "Camera/microphone is already in use by another app.";
      } else if (e.name === "OverconstrainedError") {
        errorMsg += "Camera/microphone doesn't meet requirements.";
      } else if (e.message) {
        errorMsg += e.message;
      } else {
        errorMsg += "Unknown error.";
      }

      setStatus(errorMsg);
      setIsRequestingPermissions(false);
      alert(errorMsg);
      return false;
    }
  };

  const joinRoom = async () => {
    if (!roomID || isJoining) return;
    setIsJoining(true);
    setStatus("Connecting...");

    // Make sure we have permission before trying to establish the call.
    const granted = permissionsGranted ? true : await requestPermissions();
    if (!granted) {
      setIsJoining(false);
      return;
    }

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("r", roomID);
    window.history.pushState({}, "", url.toString());

    try {
      const ensureVideoPlays = async (videoEl: HTMLVideoElement | null, stream: MediaStream) => {
        if (!videoEl) return;
        videoEl.srcObject = stream;
        try {
          await videoEl.play();
        } catch (err) {
          console.warn("Autoplay was blocked; waiting for user interaction", err);
        }
      };

      const configRes = await fetch("/config");
      const config = await configRes.json();
      const iceServers = config.iceServers || [];

      const rtc = new WebRTCManager(
        iceServers,
        (candidate) => {
          wsRef.current?.send({ t: "ice", d: candidate });
        },
        (stream) => {
          ensureVideoPlays(remoteVideoRef.current, stream);
        }
      );
      rtcRef.current = rtc;

      const stream = await rtc.startLocalStream();
      localStreamRef.current = stream;
      await ensureVideoPlays(localVideoRef.current, stream);

      const ws = new SignalingClient(roomID);
      wsRef.current = ws;

      ws.connect(
        async (msg: Message) => {
          switch (msg.t) {
            case "peer-join":
              setStatus("Peer joined, creating offer...");
              const offer = await rtc.createOffer();
              ws.send({ t: "offer", d: offer });
              break;
            case "offer":
              setStatus("Received offer, answering...");
              await rtc.createAnswer(msg.d);
              ws.send({ t: "answer", d: rtc.pc.localDescription });
              break;
            case "answer":
              setStatus("Received answer");
              await rtc.handleAnswer(msg.d);
              break;
            case "ice":
              await rtc.addIceCandidate(msg.d);
              break;
            case "leave":
              setStatus("Peer left");
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
              break;
            case "error":
              setStatus("Error: " + JSON.stringify(msg.d));
              break;
          }
        },
        () => {
          setStatus("Waiting for peer...");
          setInCall(true);
        }
      );
    } catch (e: any) {
      console.error("Error joining room:", e);

      // Show user-friendly error messages
      let errorMsg = "Failed to join: ";

      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        errorMsg += "Camera/microphone permission denied. Please allow access and try again.";
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        errorMsg += "No camera or microphone found. Please check your device.";
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        errorMsg += "Camera/microphone is already in use by another app.";
      } else if (e.name === "OverconstrainedError") {
        errorMsg += "Camera/microphone doesn't meet requirements.";
      } else if (e.message) {
        errorMsg += e.message;
      } else {
        errorMsg += "Unknown error. Check console for details.";
      }

      setStatus(errorMsg);
      setIsJoining(false);
      alert(errorMsg); // Show alert for mobile users who might not see the status
    }
  };

  const hangup = () => {
    wsRef.current?.close();
    rtcRef.current?.close();
    setInCall(false);
    setStatus("Idle");
    window.location.reload(); // Simple reset
  };

  const toggleMic = () => {
    if (rtcRef.current) {
      rtcRef.current.toggleMic(!micOn);
      setMicOn(!micOn);
    }
  };

  // Make sure the local video attaches once the element exists (after switching to call view).
  useEffect(() => {
    if (inCall && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current
        .play()
        .catch((err) => console.warn("Autoplay blocked for local video after join", err));
    }
  }, [inCall]);

  const toggleCam = () => {
    if (rtcRef.current) {
      rtcRef.current.toggleCam(!camOn);
      setCamOn(!camOn);
    }
  };

  return (
    <div className="container">
      {!inCall ? (
        <div className="lobby">
          <h1>🎥 Secure Video Call</h1>
          <p>End-to-end encrypted 1:1 WebRTC video calling</p>
          <input
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
            placeholder="Enter Room ID"
            disabled={isJoining}
          />
          <div className="actions">
            <button onClick={requestPermissions} disabled={permissionsGranted || isRequestingPermissions}>
              {permissionsGranted ? "✅ Camera & Mic Ready" : isRequestingPermissions ? "Requesting..." : "Enable Camera & Mic"}
            </button>
            <button onClick={joinRoom} disabled={isJoining || !roomID || !permissionsGranted}>
              {isJoining ? "Joining..." : "Join Room →"}
            </button>
          </div>
          <div className="status">{status}</div>
        </div>
      ) : (
        <div className="call-view">
          <div className="status">{status}</div>
          <div className="video-grid">
            <div className="video-wrapper">
              <video ref={localVideoRef} autoPlay playsInline muted />
              <p>You</p>
            </div>
            <div className="video-wrapper">
              <video ref={remoteVideoRef} autoPlay playsInline />
              <p>Remote</p>
            </div>
          </div>
          <div className="controls">
            <button className="secondary" onClick={toggleMic}>
              {micOn ? "🎤 Mute" : "🔇 Unmute"}
            </button>
            <button className="secondary" onClick={toggleCam}>
              {camOn ? "📹 Stop Cam" : "📷 Start Cam"}
            </button>
            <button className="danger" onClick={hangup}>
              ❌ Hangup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
