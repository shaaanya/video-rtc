package webembed

import "embed"

//go:embed dist/*
var Assets embed.FS
