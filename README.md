# BuilderCard

A dynamic, high-performance GitHub profile card visualizer built for the Hackyard Winter 2026 Engineering Internship Task.

## Live Demo
- Live App: https://builder-card-five.vercel.app
- GitHub Repository: https://github.com/swayamshoubinsahoo/builder-card

---

## Features
- Profile Identity: Live avatar, name, bio, location, company, public repositories, and follower counts.
- Dynamic Tech Stack: Scans public repositories and tabulates exact language frequencies.
- Starred Repositories: Ranks top repositories by star count with language chips and live links.
- Public Activity Stream: Parses the GitHub Public Events API to display recent commits, pull requests, and updates with relative timestamps.
- Sensible Error Handling: Built-in guards for 404 user lookups and 403 API rate limits with reset-time indicators.
- Share & Export: Direct URL deep linking (?user=username) and high-resolution PNG downloads via html2canvas.

---

## Tech Stack
- Frontend: HTML5, Modern CSS, Vanilla JavaScript (ES6+)
- API: GitHub REST API v3
- Image Export: html2canvas
- Deployment: Vercel

---

## Local Setup
1. Clone the repository:
git clone https://github.com/swayamshoubinsahoo/builder-card.git

2. Open index.html in your browser:
start index.html