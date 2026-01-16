#!/usr/bin/env python3
"""
Development Dashboard - Start/stop all services and monitor status.
Run: python dev.py
Open: http://localhost:5436
"""

import subprocess
import threading
import time
import json
import os
import sys
import signal
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from collections import deque

# Configuration
PORT = 5436
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

# Service definitions with metadata
SERVICES = {
    "postgres": {
        "name": "PostgreSQL",
        "cmd": ["docker", "compose", "up", "postgres"],
        "cwd": PROJECT_ROOT,
        "color": "#00d4ff",
        "description": "Primary database for persistent storage",
        "path": "docker-compose.yml → postgres",
        "port": 5432,
    },
    "redis": {
        "name": "Redis",
        "cmd": ["docker", "compose", "up", "redis"],
        "cwd": PROJECT_ROOT,
        "color": "#ff6b6b",
        "description": "In-memory cache and message broker",
        "path": "docker-compose.yml → redis",
        "port": 6379,
    },
    "backend": {
        "name": "Backend API",
        "cmd": ["docker", "compose", "up", "backend"],
        "cwd": PROJECT_ROOT,
        "color": "#00ff88",
        "description": "FastAPI REST API server",
        "path": "backend/app/main.py",
        "port": 8000,
    },
    "worker_orchestrator": {
        "name": "Orchestrator",
        "cmd": ["docker", "compose", "up", "worker_orchestrator"],
        "cwd": PROJECT_ROOT,
        "color": "#ffbe0b",
        "description": "Task scheduling and routing worker",
        "path": "backend/app/orchestrator.py",
        "port": None,
    },
    "worker_transcription": {
        "name": "Transcription",
        "cmd": ["docker", "compose", "up", "worker_transcription"],
        "cwd": PROJECT_ROOT,
        "color": "#a855f7",
        "description": "Audio transcription worker (Whisper)",
        "path": "backend/app/transcription.py",
        "port": None,
    },
    "frontend": {
        "name": "Frontend",
        "cmd": ["docker", "compose", "up", "frontend"],
        "cwd": PROJECT_ROOT,
        "color": "#06b6d4",
        "description": "Next.js web application",
        "path": "frontend/",
        "port": 3000,
    },
}

# Global state
processes = {}
logs = {svc: deque(maxlen=500) for svc in SERVICES}
start_times = {}
log_rates = {svc: deque(maxlen=60) for svc in SERVICES}  # Last 60 seconds
last_log_count = {svc: 0 for svc in SERVICES}


def update_log_rates():
    """Update log rate tracking every second."""
    while True:
        for svc_id in SERVICES:
            current = len(logs[svc_id])
            rate = current - last_log_count[svc_id]
            log_rates[svc_id].append(rate)
            last_log_count[svc_id] = current
        time.sleep(1)


def log_reader(service_id, pipe, stream_name):
    """Read from a pipe and store logs."""
    try:
        for line in iter(pipe.readline, ''):
            if line:
                timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                logs[service_id].append({
                    "time": timestamp,
                    "stream": stream_name,
                    "text": line.rstrip()
                })
        pipe.close()
    except:
        pass


def start_service(service_id):
    """Start a service."""
    if service_id in processes and processes[service_id].poll() is None:
        return {"ok": False, "error": "Already running"}

    svc = SERVICES[service_id]
    try:
        proc = subprocess.Popen(
            svc["cmd"],
            cwd=svc["cwd"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        processes[service_id] = proc
        start_times[service_id] = datetime.now()
        logs[service_id].clear()
        log_rates[service_id].clear()
        last_log_count[service_id] = 0

        threading.Thread(target=log_reader, args=(service_id, proc.stdout, "stdout"), daemon=True).start()
        threading.Thread(target=log_reader, args=(service_id, proc.stderr, "stderr"), daemon=True).start()

        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def stop_service(service_id):
    """Stop a service."""
    if service_id not in processes:
        return {"ok": False, "error": "Not running"}

    proc = processes[service_id]
    if proc.poll() is not None:
        return {"ok": False, "error": "Already stopped"}

    try:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def get_status():
    """Get status of all services."""
    status = {}
    for svc_id, svc in SERVICES.items():
        running = svc_id in processes and processes[svc_id].poll() is None
        uptime = None
        started_at = None
        if running and svc_id in start_times:
            delta = datetime.now() - start_times[svc_id]
            uptime = str(delta).split('.')[0]
            started_at = start_times[svc_id].strftime("%Y-%m-%d %H:%M:%S")

        status[svc_id] = {
            "name": svc["name"],
            "running": running,
            "uptime": uptime,
            "started_at": started_at,
            "color": svc["color"],
            "description": svc["description"],
            "path": svc["path"],
            "port": svc["port"],
            "log_count": len(logs[svc_id]),
            "sparkline": list(log_rates[svc_id])[-30:],  # Last 30 seconds
        }
    return status


def get_logs(service_id, after=0):
    """Get logs for a service."""
    if service_id not in logs:
        return []
    return list(logs[service_id])[after:]


# HTML Dashboard
DASHBOARD_HTML = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChitChat Dev Console</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #07080a;
            --bg-secondary: #0d0f12;
            --bg-tertiary: #13161b;
            --bg-elevated: #191d24;
            --border: #1e2328;
            --border-bright: #2a3038;
            --text-primary: #e8eaed;
            --text-secondary: #9aa0a6;
            --text-muted: #5f6368;
            --accent-cyan: #00d4ff;
            --accent-green: #00ff88;
            --accent-red: #ff4757;
            --accent-amber: #ffbe0b;
            --accent-purple: #a855f7;
            --glow-cyan: rgba(0, 212, 255, 0.15);
            --glow-green: rgba(0, 255, 136, 0.15);
            --glow-red: rgba(255, 71, 87, 0.15);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Space Grotesk', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            overflow: hidden;
        }

        /* Subtle grid background */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
                linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
            z-index: 0;
        }

        .app {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        /* Header */
        .header {
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--accent-cyan), var(--accent-green));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .logo-text {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .logo-text span {
            color: var(--text-muted);
            font-weight: 400;
        }

        .status-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent-green);
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .header-actions {
            display: flex;
            gap: 8px;
        }

        .btn {
            font-family: 'Space Grotesk', sans-serif;
            padding: 8px 16px;
            border: 1px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .btn-primary {
            background: var(--accent-green);
            color: #000;
            border-color: var(--accent-green);
        }

        .btn-primary:hover {
            background: #00e67a;
            box-shadow: 0 0 20px var(--glow-green);
        }

        .btn-danger {
            background: transparent;
            color: var(--accent-red);
            border-color: var(--accent-red);
        }

        .btn-danger:hover {
            background: var(--accent-red);
            color: #000;
            box-shadow: 0 0 20px var(--glow-red);
        }

        .btn-ghost {
            background: transparent;
            color: var(--text-secondary);
            border-color: var(--border);
        }

        .btn-ghost:hover {
            background: var(--bg-tertiary);
            border-color: var(--border-bright);
        }

        /* Main content */
        .main {
            display: grid;
            grid-template-columns: 340px 1fr;
            flex: 1;
            overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
            background: var(--bg-secondary);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .sidebar-header {
            padding: 16px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .sidebar-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
        }

        .service-count {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
        }

        .service-count span {
            color: var(--accent-green);
        }

        .services-list {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }

        .service-card {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            z-index: 1;
        }

        .service-card:hover {
            border-color: var(--border-bright);
            transform: translateY(-1px);
            z-index: 100;
        }

        .service-card.selected {
            border-color: var(--accent-cyan);
            background: rgba(0, 212, 255, 0.05);
        }

        .service-card.running {
            border-left: 3px solid var(--accent-green);
        }

        .service-card.stopped {
            border-left: 3px solid var(--text-muted);
        }

        .service-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .service-info {
            flex: 1;
        }

        .service-name {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .service-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .service-indicator.running {
            background: var(--accent-green);
            box-shadow: 0 0 8px var(--accent-green);
            animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
            0%, 100% { box-shadow: 0 0 8px var(--accent-green); }
            50% { box-shadow: 0 0 16px var(--accent-green); }
        }

        .service-indicator.stopped {
            background: var(--text-muted);
        }

        .service-status {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
        }

        .service-status.running {
            color: var(--accent-green);
        }

        .info-btn {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: var(--text-muted);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
            position: relative;
        }

        .info-btn:hover {
            background: var(--bg-primary);
            color: var(--text-secondary);
            border-color: var(--border-bright);
        }

        .info-btn svg {
            width: 14px;
            height: 14px;
        }

        /* Tooltip */
        .tooltip {
            position: absolute;
            top: 50%;
            left: 100%;
            margin-left: 10px;
            transform: translateY(-50%) translateX(-4px);
            background: var(--bg-elevated);
            border: 1px solid var(--border-bright);
            border-radius: 8px;
            padding: 12px;
            width: 240px;
            z-index: 1000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s ease;
        }

        .tooltip::after {
            content: '';
            position: absolute;
            top: 50%;
            left: -6px;
            transform: translateY(-50%);
            border: 6px solid transparent;
            border-right-color: var(--border-bright);
        }

        .info-btn:hover .tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateY(-50%) translateX(0);
        }

        .tooltip-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            font-size: 12px;
        }

        .tooltip-row:last-child {
            margin-bottom: 0;
        }

        .tooltip-label {
            color: var(--text-muted);
            flex-shrink: 0;
        }

        .tooltip-value {
            color: var(--text-primary);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            text-align: right;
            word-break: break-all;
        }

        .tooltip-desc {
            color: var(--text-secondary);
            font-size: 11px;
            line-height: 1.4;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--border);
        }

        /* Sparkline */
        .sparkline-container {
            height: 24px;
            margin: 10px 0;
            position: relative;
        }

        .sparkline {
            width: 100%;
            height: 100%;
        }

        .sparkline-path {
            fill: none;
            stroke: var(--accent-cyan);
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .sparkline-fill {
            fill: url(#sparkGradient);
            opacity: 0.3;
        }

        /* Service actions */
        .service-actions {
            display: flex;
            gap: 6px;
        }

        .service-actions .btn {
            flex: 1;
            justify-content: center;
            padding: 6px 12px;
            font-size: 12px;
        }

        /* Log panel */
        .log-panel {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--bg-primary);
        }

        .log-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            background: var(--bg-secondary);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }

        .log-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .log-title {
            font-weight: 600;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .log-title-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .log-meta {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
            display: flex;
            gap: 16px;
        }

        .log-meta span {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .log-header-actions {
            display: flex;
            gap: 8px;
        }

        .log-container {
            flex: 1;
            overflow-y: auto;
            padding: 0;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            line-height: 1.7;
        }

        .log-line {
            padding: 4px 20px;
            display: flex;
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            transition: background 0.1s;
        }

        .log-line:hover {
            background: var(--bg-secondary);
        }

        .log-line.stderr {
            background: rgba(255, 71, 87, 0.05);
        }

        .log-line.stderr:hover {
            background: rgba(255, 71, 87, 0.1);
        }

        .log-line.stderr .log-text {
            color: var(--accent-red);
        }

        .log-time {
            color: var(--text-muted);
            min-width: 90px;
            flex-shrink: 0;
            user-select: none;
        }

        .log-stream {
            min-width: 50px;
            flex-shrink: 0;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            user-select: none;
        }

        .log-stream.stderr {
            color: var(--accent-red);
        }

        .log-text {
            color: var(--text-primary);
            white-space: pre-wrap;
            word-break: break-all;
            flex: 1;
        }

        /* Empty states */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-muted);
            text-align: center;
            padding: 40px;
        }

        .empty-icon {
            width: 64px;
            height: 64px;
            margin-bottom: 20px;
            opacity: 0.3;
        }

        .empty-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-secondary);
        }

        .empty-desc {
            font-size: 13px;
            max-width: 280px;
            line-height: 1.5;
        }

        /* Analytics bar */
        .analytics-bar {
            background: var(--bg-secondary);
            border-top: 1px solid var(--border);
            padding: 12px 20px;
            display: flex;
            gap: 24px;
            flex-shrink: 0;
        }

        .analytics-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .analytics-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
        }

        .analytics-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .analytics-value.green { color: var(--accent-green); }
        .analytics-value.cyan { color: var(--accent-cyan); }
        .analytics-value.amber { color: var(--accent-amber); }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border-bright);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 900px) {
            .main {
                grid-template-columns: 1fr;
            }
            .sidebar {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="app">
        <header class="header">
            <div class="header-left">
                <div class="logo">
                    <div class="logo-icon">⚡</div>
                    <div class="logo-text">ChitChat <span>Dev Console</span></div>
                </div>
                <div class="status-pill">
                    <div class="status-dot"></div>
                    <span id="systemStatus">Initializing...</span>
                </div>
            </div>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="startAll()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Start All
                </button>
                <button class="btn btn-danger" onclick="stopAll()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <rect x="6" y="6" width="12" height="12" rx="1"></rect>
                    </svg>
                    Stop All
                </button>
            </div>
        </header>

        <main class="main">
            <aside class="sidebar">
                <div class="sidebar-header">
                    <span class="sidebar-title">Services</span>
                    <span class="service-count"><span id="runningCount">0</span>/6 running</span>
                </div>
                <div class="services-list" id="servicesList"></div>
            </aside>

            <section class="log-panel">
                <div class="log-header">
                    <div class="log-header-left">
                        <div class="log-title" id="logTitle">
                            <span class="log-title-dot" id="logTitleDot" style="background: var(--text-muted)"></span>
                            Select a service
                        </div>
                        <div class="log-meta" id="logMeta"></div>
                    </div>
                    <div class="log-header-actions">
                        <button class="btn btn-ghost" onclick="toggleAutoScroll()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M19 12l-7 7-7-7"/>
                            </svg>
                            <span id="autoScrollLabel">Auto-scroll</span>
                        </button>
                        <button class="btn btn-ghost" onclick="clearLogs()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                            </svg>
                            Clear
                        </button>
                    </div>
                </div>
                <div class="log-container" id="logContainer">
                    <div class="empty-state">
                        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                            <line x1="8" y1="7" x2="16" y2="7"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                            <line x1="8" y1="15" x2="12" y2="15"/>
                        </svg>
                        <div class="empty-title">No service selected</div>
                        <div class="empty-desc">Select a service from the sidebar to view its real-time logs and output.</div>
                    </div>
                </div>
                <div class="analytics-bar">
                    <div class="analytics-item">
                        <span class="analytics-label">Total Logs</span>
                        <span class="analytics-value cyan" id="totalLogs">0</span>
                    </div>
                    <div class="analytics-item">
                        <span class="analytics-label">Log Rate</span>
                        <span class="analytics-value green" id="logRate">0/s</span>
                    </div>
                    <div class="analytics-item">
                        <span class="analytics-label">Uptime</span>
                        <span class="analytics-value" id="totalUptime">--:--:--</span>
                    </div>
                    <div class="analytics-item">
                        <span class="analytics-label">Errors</span>
                        <span class="analytics-value amber" id="errorCount">0</span>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- SVG Gradient Definition -->
    <svg width="0" height="0">
        <defs>
            <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:var(--accent-cyan);stop-opacity:0.4" />
                <stop offset="100%" style="stop-color:var(--accent-cyan);stop-opacity:0" />
            </linearGradient>
        </defs>
    </svg>

    <script>
        let selectedService = null;
        let autoScroll = true;
        let allLogs = {};
        let errorCounts = {};

        async function api(endpoint, method = 'GET') {
            const res = await fetch('/api' + endpoint, { method });
            return res.json();
        }

        async function refreshStatus() {
            const status = await api('/status');
            renderSidebar(status);
            updateSystemStatus(status);
        }

        function updateSystemStatus(status) {
            const running = Object.values(status).filter(s => s.running).length;
            document.getElementById('runningCount').textContent = running;
            document.getElementById('systemStatus').textContent =
                running === 0 ? 'All stopped' :
                running === 6 ? 'All systems operational' :
                `${running} services running`;
        }

        function createSparkline(data, color) {
            if (!data || data.length === 0) {
                data = Array(30).fill(0);
            }

            const width = 200;
            const height = 24;
            const max = Math.max(...data, 1);
            const points = data.map((val, i) => {
                const x = (i / (data.length - 1)) * width;
                const y = height - (val / max) * height;
                return `${x},${y}`;
            }).join(' ');

            const fillPoints = `0,${height} ${points} ${width},${height}`;

            return `
                <svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                    <polygon class="sparkline-fill" points="${fillPoints}" style="fill: ${color}20"/>
                    <polyline class="sparkline-path" points="${points}" style="stroke: ${color}"/>
                </svg>
            `;
        }

        function renderSidebar(status) {
            const list = document.getElementById('servicesList');
            list.innerHTML = Object.entries(status).map(([id, svc]) => `
                <div class="service-card ${selectedService === id ? 'selected' : ''} ${svc.running ? 'running' : 'stopped'}"
                     onclick="selectService('${id}')">
                    <div class="service-top">
                        <div class="service-info">
                            <div class="service-name">
                                <span class="service-indicator ${svc.running ? 'running' : 'stopped'}"></span>
                                ${svc.name}
                            </div>
                            <div class="service-status ${svc.running ? 'running' : ''}">
                                ${svc.running ? svc.uptime || 'Starting...' : 'Stopped'}
                            </div>
                        </div>
                        <div class="info-btn" onclick="event.stopPropagation()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            <div class="tooltip">
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Path</span>
                                    <span class="tooltip-value">${svc.path}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Port</span>
                                    <span class="tooltip-value">${svc.port || 'N/A'}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Started</span>
                                    <span class="tooltip-value">${svc.started_at || 'Never'}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Logs</span>
                                    <span class="tooltip-value">${svc.log_count} lines</span>
                                </div>
                                <div class="tooltip-desc">${svc.description}</div>
                            </div>
                        </div>
                    </div>
                    <div class="sparkline-container">
                        ${createSparkline(svc.sparkline, svc.color)}
                    </div>
                    <div class="service-actions">
                        ${svc.running
                            ? `<button class="btn btn-danger" onclick="event.stopPropagation(); stopService('${id}')">Stop</button>`
                            : `<button class="btn btn-primary" onclick="event.stopPropagation(); startService('${id}')">Start</button>`
                        }
                    </div>
                </div>
            `).join('');
        }

        async function startService(id) {
            await api('/start/' + id, 'POST');
            refreshStatus();
        }

        async function stopService(id) {
            await api('/stop/' + id, 'POST');
            refreshStatus();
        }

        async function startAll() {
            const order = ['postgres', 'redis', 'backend', 'worker_orchestrator', 'worker_transcription', 'frontend'];
            for (const id of order) {
                await api('/start/' + id, 'POST');
                await new Promise(r => setTimeout(r, 800));
                refreshStatus();
            }
        }

        async function stopAll() {
            const order = ['frontend', 'worker_transcription', 'worker_orchestrator', 'backend', 'redis', 'postgres'];
            for (const id of order) {
                await api('/stop/' + id, 'POST');
            }
            refreshStatus();
        }

        function selectService(id) {
            selectedService = id;
            refreshStatus();
            refreshLogs();
        }

        async function refreshLogs() {
            if (!selectedService) return;

            const status = await api('/status');
            const svc = status[selectedService];
            const logs = await api('/logs/' + selectedService);

            // Update header
            document.getElementById('logTitle').innerHTML = `
                <span class="log-title-dot" style="background: ${svc.color}"></span>
                ${svc.name}
            `;

            document.getElementById('logMeta').innerHTML = `
                <span>${logs.length} lines</span>
                ${svc.running ? `<span>● Live</span>` : ''}
            `;

            const container = document.getElementById('logContainer');

            if (logs.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                        </svg>
                        <div class="empty-title">No logs yet</div>
                        <div class="empty-desc">${svc.running ? 'Waiting for output...' : 'Start the service to see logs.'}</div>
                    </div>
                `;
                return;
            }

            allLogs[selectedService] = logs;
            let errors = 0;

            container.innerHTML = logs.map(log => {
                if (log.stream === 'stderr') errors++;
                return `
                    <div class="log-line ${log.stream === 'stderr' ? 'stderr' : ''}">
                        <span class="log-time">${log.time}</span>
                        <span class="log-stream ${log.stream}">${log.stream === 'stderr' ? 'err' : 'out'}</span>
                        <span class="log-text">${escapeHtml(log.text)}</span>
                    </div>
                `;
            }).join('');

            errorCounts[selectedService] = errors;

            if (autoScroll) {
                container.scrollTop = container.scrollHeight;
            }

            // Update analytics
            updateAnalytics(logs, svc, errors);
        }

        function updateAnalytics(logs, svc, errors) {
            document.getElementById('totalLogs').textContent = logs.length;
            document.getElementById('errorCount').textContent = errors;
            document.getElementById('totalUptime').textContent = svc.uptime || '--:--:--';

            // Calculate log rate from sparkline
            const sparkline = svc.sparkline || [];
            const recentRate = sparkline.slice(-5).reduce((a, b) => a + b, 0) / Math.max(sparkline.slice(-5).length, 1);
            document.getElementById('logRate').textContent = recentRate.toFixed(1) + '/s';
        }

        function toggleAutoScroll() {
            autoScroll = !autoScroll;
            document.getElementById('autoScrollLabel').textContent = autoScroll ? 'Auto-scroll' : 'Scroll paused';
        }

        function clearLogs() {
            document.getElementById('logContainer').innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    <div class="empty-title">Logs cleared</div>
                    <div class="empty-desc">New logs will appear here as they come in.</div>
                </div>
            `;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Auto-refresh
        setInterval(refreshStatus, 2000);
        setInterval(refreshLogs, 1000);
        refreshStatus();
    </script>
</body>
</html>
'''


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress default logging

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        path = urlparse(self.path).path

        if path == '/' or path == '/index.html':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(DASHBOARD_HTML.encode())

        elif path == '/api/status':
            self.send_json(get_status())

        elif path.startswith('/api/logs/'):
            service_id = path.split('/')[-1]
            self.send_json(get_logs(service_id))

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path

        if path.startswith('/api/start/'):
            service_id = path.split('/')[-1]
            if service_id in SERVICES:
                self.send_json(start_service(service_id))
            else:
                self.send_json({"ok": False, "error": "Unknown service"}, 400)

        elif path.startswith('/api/stop/'):
            service_id = path.split('/')[-1]
            if service_id in SERVICES:
                self.send_json(stop_service(service_id))
            else:
                self.send_json({"ok": False, "error": "Unknown service"}, 400)

        else:
            self.send_response(404)
            self.end_headers()


def cleanup(signum=None, frame=None):
    """Stop all services on exit."""
    print("\n⏹  Stopping all services...")
    for svc_id in processes:
        stop_service(svc_id)
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    # Start log rate tracker
    threading.Thread(target=update_log_rates, daemon=True).start()

    print(f"""
┌─────────────────────────────────────────┐
│  ChitChat Dev Console                   │
│                                         │
│  URL: http://localhost:{PORT}              │
│  Press Ctrl+C to stop                   │
└─────────────────────────────────────────┘
""")

    server = HTTPServer(('0.0.0.0', PORT), Handler)
    server.serve_forever()


if __name__ == '__main__':
    main()
