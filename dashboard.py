import tkinter as tk
from tkinter import ttk, scrolledtext
import subprocess
import threading
import time
import requests
import sys
import os

# --- CONFIGURATION ---
NODE_SERVER_URL = "http://localhost:3000/stats"  # The URL to check user count
GIT_COMMIT_MSG = "Auto-save: 10 min interval"
PUSH_INTERVAL = 10 * 60  # 10 minutes in seconds

class DevDashboard:
    def __init__(self, root):
        self.root = root
        self.root.title("Auto-Git & Server Manager")
        self.root.geometry("700x500")
        self.root.configure(bg="#1e1e1e")

        # State Variables
        self.server_process = None
        self.is_running = False
        self.next_push_time = 0

        # --- GUI STYLES ---
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TFrame", background="#1e1e1e")
        style.configure("TLabel", background="#1e1e1e", foreground="#ffffff", font=("Segoe UI", 10))
        style.configure("Header.TLabel", font=("Segoe UI", 16, "bold"), foreground="#00e676")
        style.configure("Stat.TLabel", font=("Segoe UI", 32, "bold"), foreground="#00e676")
        style.configure("TButton", font=("Segoe UI", 10, "bold"), padding=6)
        
        # --- LAYOUT ---
        
        # 1. Header Section
        header_frame = ttk.Frame(root)
        header_frame.pack(pady=20, fill="x", padx=20)
        
        lbl_title = ttk.Label(header_frame, text="Developer Control Center", style="Header.TLabel")
        lbl_title.pack(side="left")

        # 2. Stats Section (Active Users)
        stats_frame = ttk.Frame(root)
        stats_frame.pack(pady=10, fill="x", padx=20)
        
        ttk.Label(stats_frame, text="ACTIVE USERS").pack(anchor="w")
        self.lbl_user_count = ttk.Label(stats_frame, text="OFFLINE", style="Stat.TLabel")
        self.lbl_user_count.pack(anchor="w")

        # 3. Controls Section
        ctrl_frame = ttk.Frame(root)
        ctrl_frame.pack(pady=10, fill="x", padx=20)

        self.btn_start = tk.Button(ctrl_frame, text="▶ START SERVER", bg="#00e676", fg="black", 
                                   font=("Segoe UI", 10, "bold"), command=self.start_server, padx=20, pady=5)
        self.btn_start.pack(side="left", padx=(0, 10))

        self.btn_stop = tk.Button(ctrl_frame, text="■ STOP", bg="#cf6679", fg="black", 
                                  font=("Segoe UI", 10, "bold"), command=self.stop_server, padx=20, pady=5, state="disabled")
        self.btn_stop.pack(side="left")

        self.lbl_timer = ttk.Label(ctrl_frame, text="Next Push: --:--")
        self.lbl_timer.pack(side="right", padx=10)

        # 4. Logs Section
        log_frame = ttk.Frame(root)
        log_frame.pack(pady=10, fill="both", expand=True, padx=20)
        
        ttk.Label(log_frame, text="SYSTEM LOGS").pack(anchor="w", pady=(0, 5))
        
        self.log_area = scrolledtext.ScrolledText(log_frame, bg="#2d2d2d", fg="#d4d4d4", 
                                                  font=("Consolas", 9), relief="flat", padx=10, pady=10)
        self.log_area.pack(fill="both", expand=True)

    def log(self, message):
        """Adds a message to the log window"""
        timestamp = time.strftime("[%H:%M:%S] ")
        self.log_area.insert(tk.END, timestamp + message + "\n")
        self.log_area.see(tk.END)

    def start_server(self):
        if self.is_running: return
        
        self.is_running = True
        self.btn_start.config(state="disabled", bg="#444")
        self.btn_stop.config(state="normal", bg="#cf6679")
        self.lbl_user_count.config(text="0")
        
        self.log("Starting 'yarn start'...")

        # 1. Start Node Server in a Thread
        self.server_thread = threading.Thread(target=self.run_yarn_process, daemon=True)
        self.server_thread.start()

        # 2. Start Git Automation Loop
        self.git_thread = threading.Thread(target=self.run_git_loop, daemon=True)
        self.git_thread.start()

        # 3. Start User Polling Loop
        self.poll_thread = threading.Thread(target=self.run_user_poll_loop, daemon=True)
        self.poll_thread.start()

    def run_yarn_process(self):
        # Using shell=True for Windows compatibility with 'yarn' command
        try:
            self.server_process = subprocess.Popen(
                "yarn start", 
                shell=True, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Read stdout line by line
            while self.is_running and self.server_process.poll() is None:
                line = self.server_process.stdout.readline()
                if line:
                    self.log(f"[Server] {line.strip()}")
        except Exception as e:
            self.log(f"Error starting server: {e}")

    def stop_server(self):
        self.is_running = False
        if self.server_process:
            self.log("Stopping server...")
            # On Windows, killing the shell doesn't always kill the child node process
            # A more robust kill command usually involves taskkill in Windows or kill in Linux
            if os.name == 'nt':
                subprocess.run(f"taskkill /F /T /PID {self.server_process.pid}", shell=True)
            else:
                self.server_process.terminate()
            
        self.btn_start.config(state="normal", bg="#00e676")
        self.btn_stop.config(state="disabled", bg="#444")
        self.lbl_user_count.config(text="OFFLINE", foreground="#cf6679")

    def run_git_loop(self):
        timer = PUSH_INTERVAL
        while self.is_running:
            if timer <= 0:
                self.perform_git_push()
                timer = PUSH_INTERVAL
            
            # Update GUI Timer
            mins, secs = divmod(timer, 60)
            self.root.after(0, lambda m=mins, s=secs: self.lbl_timer.config(text=f"Next Push: {m:02d}:{s:02d}"))
            
            time.sleep(1)
            timer -= 1

    def perform_git_push(self):
        self.log("--- AUTO-GIT STARTING ---")
        try:
            subprocess.run("git add .", shell=True, check=True)
            # Only commit if there are changes
            subprocess.run(f'git commit -m "{GIT_COMMIT_MSG}"', shell=True)
            result = subprocess.run("git push", shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.log("✔ Git Push Successful")
            else:
                self.log(f"✘ Git Push Failed: {result.stderr}")
        except Exception as e:
            self.log(f"Git Error: {e}")

    def run_user_poll_loop(self):
        """Polls the local node server for active user count"""
        while self.is_running:
            try:
                # Expects a JSON response like { "activeUsers": 5 }
                response = requests.get(NODE_SERVER_URL, timeout=2)
                if response.status_code == 200:
                    data = response.json()
                    count = data.get("activeUsers", 0)
                    self.root.after(0, lambda c=count: self.lbl_user_count.config(text=str(c), foreground="#00e676"))
            except requests.exceptions.ConnectionError:
                # Server might be starting up
                self.root.after(0, lambda: self.lbl_user_count.config(text="Starting...", foreground="orange"))
            except Exception as e:
                print(f"Polling error: {e}")
            
            time.sleep(2)  # Check every 2 seconds

if __name__ == "__main__":
    root = tk.Tk()
    app = DevDashboard(root)
    root.mainloop()