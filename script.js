// CyberLens Interactive Logic & Multi-Simulator System

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- Web Audio API Hacker Synth Tone Generator ---
  let audioCtx = null;
  const playTone = (frequency, type = "sine", duration = 0.1, slideTo = 0) => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      if (slideTo > 0) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
      }
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      console.warn("AudioContext blocking bypassed. Interactions will unlock sound.", err);
    }
  };

  // --- Features Accordion ---
  const featureCards = document.querySelectorAll(".feature-card");
  featureCards.forEach(card => {
    card.addEventListener("click", () => {
      const isAlreadyActive = card.classList.contains("active");
      
      // Close all cards first
      featureCards.forEach(c => {
        c.classList.remove("active");
      });
      
      // Toggle active state for current card
      if (!isAlreadyActive) {
        card.classList.add("active");
        playTone(550, "sine", 0.05);
      } else {
        playTone(400, "sine", 0.05);
      }
    });
  });

  // --- Simulator Tabs Navigation ---
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      
      btn.classList.add("active");
      const targetPane = document.getElementById(`tab-${tabName}`);
      if (targetPane) {
        targetPane.classList.add("active");
      }
      
      // Clear badge if opening C2 tab
      if (tabName === "c2") {
        document.getElementById("c2-badge").classList.add("hidden");
      }

      // Re-trigger Lucide icon renders
      if (window.lucide) {
        window.lucide.createIcons();
      }
      
      playTone(600, "sine", 0.04);
    });
  });


  // ==========================================
  // MODULE 1: WEB RECONNAISSANCE SCANNER
  // ==========================================
  const domainInput = document.getElementById("domain-input");
  const btnStartScan = document.getElementById("btn-start-scan");
  const btnScanText = document.getElementById("btn-scan-text");
  const btnResetScan = document.getElementById("btn-reset-scan");
  
  const progressContainer = document.getElementById("progress-container");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressPercent = document.getElementById("progress-percent");
  const scanPhaseText = document.getElementById("scan-phase-text");
  
  const quickStats = document.getElementById("quick-stats");
  const statSubdomains = document.getElementById("stat-subdomains");
  const statPorts = document.getElementById("stat-ports");
  const statVulns = document.getElementById("stat-vulns");
  
  const terminalBody = document.getElementById("terminal-body");
  
  const resultsDashboard = document.getElementById("results-dashboard");
  const subdomainsList = document.getElementById("subdomains-list");
  const portsList = document.getElementById("ports-list");
  const vulnerabilitiesList = document.getElementById("vulnerabilities-list");

  let isScanning = false;
  let subdomainResults = [];
  let portResults = [];
  let vulnerabilityResults = [];

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const addTerminalLine = (text, type = "text") => {
    const placeholder = terminalBody.querySelector(".terminal-placeholder");
    if (placeholder) {
      placeholder.remove();
    }

    const line = document.createElement("div");
    line.className = `terminal-line ${type}`;
    line.innerHTML = `<span class="terminal-prompt">$</span> ${text}`;
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  };

  const showTerminalCursor = (show) => {
    let cursor = terminalBody.querySelector(".terminal-cursor");
    if (show) {
      if (!cursor) {
        cursor = document.createElement("div");
        cursor.className = "terminal-cursor";
        terminalBody.appendChild(cursor);
      }
      terminalBody.scrollTop = terminalBody.scrollHeight;
    } else if (cursor) {
      cursor.remove();
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "critical": return "critical";
      case "high": return "high";
      case "medium": return "medium";
      case "low": return "low";
      default: return "";
    }
  };

  const getRiskColorClass = (risk) => {
    switch (risk) {
      case "high": return "text-red";
      case "medium": return "text-yellow";
      case "low": return "text-green";
      default: return "text-muted";
    }
  };

  const simulateScan = async () => {
    const domain = domainInput.value.trim();
    if (!domain) {
      playTone(200, "sawtooth", 0.2);
      addTerminalLine("[ERROR] Por favor ingresa un dominio válido", "error");
      return;
    }

    isScanning = true;
    playTone(520, "sine", 0.1);
    
    domainInput.disabled = true;
    btnStartScan.disabled = true;
    btnStartScan.classList.add("opacity-50");
    btnScanText.innerText = "Escaneando...";
    btnStartScan.querySelector(".btn-icon").outerHTML = '<div class="btn-icon spinner-small" style="width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spinSpeed 0.8s linear infinite;"></div>';
    
    terminalBody.innerHTML = "";
    subdomainsList.innerHTML = "";
    portsList.innerHTML = "";
    vulnerabilitiesList.innerHTML = "";
    
    quickStats.classList.add("hidden");
    resultsDashboard.classList.add("hidden");
    progressContainer.classList.remove("hidden");
    progressBarFill.style.width = "0%";
    progressPercent.innerText = "0%";
    
    subdomainResults = [];
    portResults = [];
    vulnerabilityResults = [];

    // Phase 1: Subdomains
    scanPhaseText.innerText = "Buscando subdominios...";
    addTerminalLine("Iniciando CyberLens v2.5...", "info");
    await delay(500);
    addTerminalLine(`Objetivo: ${domain}`, "text");
    await delay(300);
    addTerminalLine("Enumerando DNS...", "info");
    showTerminalCursor(true);

    const subdomainsData = [
      { name: `api.${domain}`, ip: "104.24.12.18" },
      { name: `dev.${domain}`, ip: "104.24.12.22" },
      { name: `staging.${domain}`, ip: "172.56.9.112" },
      { name: `admin.${domain}`, ip: "104.24.12.9" },
      { name: `mail.${domain}`, ip: "207.46.12.5" },
      { name: `cdn.${domain}`, ip: "104.24.12.100" }
    ];

    for (let i = 0; i < subdomainsData.length; i++) {
      if (!isScanning) return;
      await delay(400);
      showTerminalCursor(false);
      
      const sub = subdomainsData[i];
      subdomainResults.push(sub);
      addTerminalLine(`[+] Subdominio encontrado: ${sub.name} [${sub.ip}]`, "success");
      playTone(800, "sine", 0.05);

      const progress = Math.round(((i + 1) / subdomainsData.length) * 30);
      progressBarFill.style.width = `${progress}%`;
      progressPercent.innerText = `${progress}%`;
      showTerminalCursor(true);
    }

    // Phase 2: Ports
    if (!isScanning) return;
    scanPhaseText.innerText = "Escaneando puertos...";
    showTerminalCursor(false);
    await delay(500);
    addTerminalLine("Iniciando Nmap Syn-Stealth Scan...", "info");
    showTerminalCursor(true);

    const portsData = [
      { port: 22, service: "SSH", status: "open", risk: "medium" },
      { port: 80, service: "HTTP", status: "open", risk: "low" },
      { port: 443, service: "HTTPS", status: "open", risk: "low" },
      { port: 3306, service: "MySQL", status: "filtered", risk: "high" },
      { port: 8080, service: "HTTP-ALT", status: "open", risk: "medium" },
      { port: 27017, service: "MongoDB", status: "open", risk: "high" }
    ];

    for (let i = 0; i < portsData.length; i++) {
      if (!isScanning) return;
      await delay(350);
      showTerminalCursor(false);
      
      const port = portsData[i];
      portResults.push(port);
      
      const isFiltered = port.status === "filtered";
      const lineClass = isFiltered ? "warning" : "warning"; 
      const prefix = isFiltered ? "[~]" : "[!]";
      addTerminalLine(`${prefix} Puerto ${port.port} (${port.service}): ${port.status.toUpperCase()}`, lineClass);
      playTone(680, "sine", 0.05);

      const progress = 30 + Math.round(((i + 1) / portsData.length) * 35);
      progressBarFill.style.width = `${progress}%`;
      progressPercent.innerText = `${progress}%`;
      showTerminalCursor(true);
    }

    // Phase 3: Vulnerabilities
    if (!isScanning) return;
    scanPhaseText.innerText = "Detectando vulnerabilidades...";
    showTerminalCursor(false);
    await delay(500);
    addTerminalLine("Ejecutando scripts Nuclei & OWASP ZAP...", "info");
    showTerminalCursor(true);

    const vulnerabilitiesData = [
      { id: "CVE-2026-0412", name: "Inyección SQL Crítica", severity: "critical", description: "Inyección SQL detectada en el endpoint /api/v1/auth" },
      { id: "CVE-2026-9923", name: "XSS Reflejado", severity: "high", description: "Cross-Site Scripting en parámetro de búsqueda query" },
      { id: "CVE-2026-3829", name: "Falta de Headers CSP", severity: "medium", description: "Políticas de Content-Security-Policy incompletas" },
      { id: "CVE-2026-5839", name: "Soporte TLS 1.1 Inseguro", severity: "medium", description: "El servidor acepta suites de cifrado antiguas" },
      { id: "CVE-2026-1029", name: "Revelación de Versión", severity: "low", description: "Servidor expone cabecera Server: Apache/2.4.41" }
    ];

    for (let i = 0; i < vulnerabilitiesData.length; i++) {
      if (!isScanning) return;
      await delay(450);
      showTerminalCursor(false);
      
      const vuln = vulnerabilitiesData[i];
      vulnerabilityResults.push(vuln);
      
      const isCritical = vuln.severity === "critical";
      const isHigh = vuln.severity === "high";
      const lineClass = isCritical ? "error" : isHigh ? "warning" : "text";
      const prefix = isCritical ? "[!!]" : isHigh ? "[!]" : "[~]";
      addTerminalLine(`${prefix} ${vuln.severity.toUpperCase()}: ${vuln.name}`, lineClass);
      
      if (isCritical) {
        playTone(400, "sawtooth", 0.2);
      } else {
        playTone(600, "sine", 0.08);
      }

      const progress = 65 + Math.round(((i + 1) / vulnerabilitiesData.length) * 35);
      progressBarFill.style.width = `${progress}%`;
      progressPercent.innerText = `${progress}%`;
      showTerminalCursor(true);
    }

    // Phase 4: Complete
    if (!isScanning) return;
    showTerminalCursor(false);
    await delay(500);
    
    progressBarFill.style.width = "100%";
    progressPercent.innerText = "100%";
    scanPhaseText.innerText = "Escaneo completado";
    
    addTerminalLine("Reporte de escaneo consolidado con éxito.", "success");
    const openPortsCount = portResults.filter(p => p.status === "open").length;
    addTerminalLine(`[RECON] ${subdomainResults.length} Subdominios | ${openPortsCount} Puertos | ${vulnerabilityResults.length} Vulnerabilidades`, "success");
    
    playTone(880, "sine", 0.15);
    setTimeout(() => playTone(1100, "sine", 0.2), 120);

    renderResults();
    quickStats.classList.remove("hidden");
    resultsDashboard.classList.remove("hidden");
    restoreScanButtons();
    isScanning = false;
  };

  const restoreScanButtons = () => {
    domainInput.disabled = false;
    btnStartScan.disabled = false;
    btnStartScan.classList.remove("opacity-50");
    btnScanText.innerText = "Iniciar Reconocimiento";
    
    const spinner = btnStartScan.querySelector(".spinner-small");
    if (spinner) {
      const playIcon = document.createElement("i");
      playIcon.setAttribute("data-lucide", "play");
      playIcon.className = "btn-icon";
      spinner.replaceWith(playIcon);
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  const renderResults = () => {
    statSubdomains.innerText = subdomainResults.length;
    statPorts.innerText = portResults.filter(p => p.status === "open").length;
    statVulns.innerText = vulnerabilityResults.length;

    subdomainsList.innerHTML = subdomainResults.map(sub => `
      <div class="list-item-subdomain">
        <span class="subdomain-name">${sub.name}</span>
        <span class="subdomain-ip">${sub.ip}</span>
      </div>
    `).join("");

    portsList.innerHTML = portResults.map(port => `
      <div class="list-item-port">
        <div class="port-info">
          <span class="port-status-indicator ${port.status}"></span>
          <span class="port-num">${port.port}</span>
          <span class="port-service">${port.service}</span>
        </div>
        <span class="port-risk ${getRiskColorClass(port.risk)}">${port.risk}</span>
      </div>
    `).join("");

    vulnerabilitiesList.innerHTML = vulnerabilityResults.map(vuln => `
      <div class="list-item-vuln">
        <div class="vuln-row">
          <span class="vuln-title">${vuln.name}</span>
          <span class="vuln-badge ${getSeverityBadgeClass(vuln.severity)}">${vuln.severity}</span>
        </div>
        <p class="vuln-desc">${vuln.description}</p>
      </div>
    `).join("");
  };

  const resetScan = () => {
    isScanning = false;
    playTone(300, "sine", 0.15);
    restoreScanButtons();
    progressContainer.classList.add("hidden");
    quickStats.classList.add("hidden");
    resultsDashboard.classList.add("hidden");
    
    progressBarFill.style.width = "0%";
    progressPercent.innerText = "0%";
    scanPhaseText.innerText = "Preparando...";
    
    subdomainResults = [];
    portResults = [];
    vulnerabilityResults = [];
    
    subdomainsList.innerHTML = "";
    portsList.innerHTML = "";
    vulnerabilitiesList.innerHTML = "";
    
    terminalBody.innerHTML = `
      <div class="terminal-placeholder">
        <span class="terminal-prompt">$</span> Esperando comando...
      </div>
    `;
    domainInput.value = "";
  };

  btnStartScan.addEventListener("click", () => {
    if (!isScanning) simulateScan();
  });
  btnResetScan.addEventListener("click", resetScan);
  domainInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !isScanning) simulateScan();
  });


  // ==========================================
  // MODULE 2: QR PHISHING & SMARTPHONE SIMULATOR
  // ==========================================
  const qrTargetType = document.getElementById("qr-target-type");
  const qrCodeWrapper = document.getElementById("qr-code-wrapper");
  const qrGraphicElement = document.getElementById("qr-graphic-element");
  const qrStatusOverlay = document.getElementById("qr-status-overlay");
  
  // Phone Elements
  const phoneStateHome = document.getElementById("phone-state-home");
  const phoneStateCamera = document.getElementById("phone-state-camera");
  const phoneStateBrowser = document.getElementById("phone-state-browser");
  const phoneStateCompromised = document.getElementById("phone-state-compromised");
  
  const btnPhoneCamera = document.getElementById("btn-phone-camera");
  const btnCameraBack = document.getElementById("btn-camera-back");
  const btnPhoneHome = document.getElementById("btn-phone-home");
  
  const browserUrlText = document.getElementById("browser-url-text");
  const browserViewportContent = document.getElementById("browser-viewport-content");

  // Dynamic QR Code SVG renderer
  const drawDynamicQR = (type) => {
    let primaryColor = "var(--cyan)";
    let pathDetails = "";
    
    if (type === "whatsapp") {
      primaryColor = "#00d4ff"; // Bright Cyan
      pathDetails = `
        <!-- Finder Patterns -->
        <rect x="15" y="15" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="25" y="25" width="20" height="20" fill="${primaryColor}"/>
        
        <rect x="145" y="15" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="155" y="25" width="20" height="20" fill="${primaryColor}"/>
        
        <rect x="15" y="145" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="25" y="155" width="20" height="20" fill="${primaryColor}"/>
        
        <!-- WhatsApp Mockup Icon center -->
        <circle cx="100" cy="100" r="18" fill="var(--bg-color)" stroke="${primaryColor}" stroke-width="2"/>
        <path d="M93,98 A8,8 0 0,0 106,104 L108,107 L105,103 A8,8 0 0,0 93,98 Z" fill="${primaryColor}"/>
        
        <!-- Random bits -->
        <rect x="65" y="20" width="10" height="10" fill="${primaryColor}"/>
        <rect x="85" y="15" width="15" height="15" fill="${primaryColor}"/>
        <rect x="110" y="30" width="20" height="10" fill="${primaryColor}"/>
        <rect x="65" y="65" width="25" height="20" fill="${primaryColor}"/>
        <rect x="105" y="65" width="15" height="25" fill="${primaryColor}"/>
        <rect x="15" y="70" width="15" height="10" fill="${primaryColor}"/>
        <rect x="35" y="110" width="20" height="15" fill="${primaryColor}"/>
        <rect x="70" y="110" width="15" height="25" fill="${primaryColor}"/>
        <rect x="120" y="125" width="25" height="10" fill="${primaryColor}"/>
        <rect x="160" y="70" width="20" height="10" fill="${primaryColor}"/>
        <rect x="145" y="105" width="15" height="15" fill="${primaryColor}"/>
        <rect x="110" y="155" width="20" height="10" fill="${primaryColor}"/>
        <rect x="155" y="150" width="10" height="25" fill="${primaryColor}"/>
      `;
    } else if (type === "bank") {
      primaryColor = "#facc15"; // Golden Yellow
      pathDetails = `
        <rect x="15" y="15" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="25" y="25" width="20" height="20" fill="${primaryColor}"/>
        
        <rect x="145" y="15" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="155" y="25" width="20" height="20" fill="${primaryColor}"/>
        
        <rect x="15" y="145" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="25" y="155" width="20" height="20" fill="${primaryColor}"/>
        
        <!-- Bank Building Mockup Center -->
        <circle cx="100" cy="100" r="18" fill="var(--bg-color)" stroke="${primaryColor}" stroke-width="2"/>
        <path d="M100,90 L90,96 L110,96 Z M94,97 L94,106 M100,97 L100,106 M106,97 L106,106 M90,107 L110,107" stroke="${primaryColor}" stroke-width="1.5" fill="none"/>
        
        <rect x="70" y="25" width="15" height="10" fill="${primaryColor}"/>
        <rect x="115" y="15" width="10" height="25" fill="${primaryColor}"/>
        <rect x="65" y="55" width="20" height="20" fill="${primaryColor}"/>
        <rect x="120" y="60" width="15" height="15" fill="${primaryColor}"/>
        <rect x="20" y="75" width="15" height="20" fill="${primaryColor}"/>
        <rect x="40" y="115" width="20" height="10" fill="${primaryColor}"/>
        <rect x="75" y="105" width="10" height="30" fill="${primaryColor}"/>
        <rect x="110" y="110" width="25" height="10" fill="${primaryColor}"/>
        <rect x="165" y="75" width="10" height="25" fill="${primaryColor}"/>
        <rect x="145" y="115" width="20" height="10" fill="${primaryColor}"/>
        <rect x="125" y="145" width="15" height="20" fill="${primaryColor}"/>
        <rect x="155" y="155" width="20" height="15" fill="${primaryColor}"/>
      `;
    } else { // wifi
      primaryColor = "#ef4444"; // Dangerous Red/Magenta glow
      pathDetails = `
        <rect x="15" y="15" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="25" y="25" width="20" height="20" fill="${primaryColor}"/>
        
        <rect x="145" y="15" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="155" y="25" width="20" height="20" fill="${primaryColor}"/>
        
        <rect x="15" y="145" width="40" height="40" fill="none" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="25" y="155" width="20" height="20" fill="${primaryColor}"/>
        
        <!-- WiFi signal Mockup center -->
        <circle cx="100" cy="100" r="18" fill="var(--bg-color)" stroke="${primaryColor}" stroke-width="2"/>
        <path d="M92,94 A10,10 0 0,1 108,94 M95,98 A6,6 0 0,1 105,98 M98,102 A2,2 0 0,1 102,102" stroke="${primaryColor}" stroke-width="1.8" fill="none"/>
        
        <rect x="65" y="15" width="15" height="15" fill="${primaryColor}"/>
        <rect x="110" y="20" width="20" height="10" fill="${primaryColor}"/>
        <rect x="65" y="70" width="25" height="10" fill="${primaryColor}"/>
        <rect x="120" y="65" width="10" height="20" fill="${primaryColor}"/>
        <rect x="15" y="70" width="25" height="15" fill="${primaryColor}"/>
        <rect x="45" y="115" width="15" height="15" fill="${primaryColor}"/>
        <rect x="80" y="120" width="15" height="10" fill="${primaryColor}"/>
        <rect x="115" y="105" width="20" height="20" fill="${primaryColor}"/>
        <rect x="150" y="100" width="25" height="10" fill="${primaryColor}"/>
        <rect x="160" y="65" width="15" height="25" fill="${primaryColor}"/>
        <rect x="110" y="150" width="15" height="15" fill="${primaryColor}"/>
        <rect x="155" y="145" width="20" height="20" fill="${primaryColor}"/>
      `;
    }
    
    qrCodeWrapper.style.borderColor = primaryColor;
    qrCodeWrapper.style.boxShadow = `0 0 35px ${primaryColor}50`;
    qrGraphicElement.innerHTML = `
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background-color:transparent;">
        ${pathDetails}
      </svg>
    `;
  };

  // Change QR and setup
  drawDynamicQR("whatsapp");
  qrTargetType.addEventListener("change", (e) => {
    drawDynamicQR(e.target.value);
    playTone(600, "sine", 0.08);
  });

  // State switcher helper
  const setPhoneState = (state) => {
    phoneStateHome.classList.add("hidden");
    phoneStateCamera.classList.add("hidden");
    phoneStateBrowser.classList.add("hidden");
    phoneStateCompromised.classList.add("hidden");
    
    if (state === "home") phoneStateHome.classList.remove("hidden");
    if (state === "camera") phoneStateCamera.classList.remove("hidden");
    if (state === "browser") phoneStateBrowser.classList.remove("hidden");
    if (state === "compromised") phoneStateCompromised.classList.remove("hidden");
  };

  btnPhoneCamera.addEventListener("click", () => {
    setPhoneState("camera");
    playTone(440, "sine", 0.1);
    
    // Pulse desktop status overlay
    qrStatusOverlay.classList.remove("hidden");
    
    // Simulate scan laser sweep
    setTimeout(() => {
      // Decode QR success
      playTone(880, "sine", 0.15);
      
      // Update desktop status
      const overlayText = qrStatusOverlay.querySelector("span");
      overlayText.innerText = "SCAN COMPLETO. CARGANDO PERFIL...";
      overlayText.className = "font-mono text-green";
      
      setTimeout(() => {
        setPhoneState("browser");
        loadPhishingInPhone(qrTargetType.value);
      }, 1000);
    }, 2800);
  });

  btnCameraBack.addEventListener("click", () => {
    setPhoneState("home");
    qrStatusOverlay.classList.add("hidden");
    playTone(330, "sine", 0.08);
  });

  btnPhoneHome.addEventListener("click", () => {
    setPhoneState("home");
    qrStatusOverlay.classList.add("hidden");
    // Reset desktop QR label
    const overlayText = qrStatusOverlay.querySelector("span");
    overlayText.innerText = "ESPERANDO ESCANEO...";
    overlayText.className = "font-mono text-cyan";
    playTone(300, "sine", 0.1);
  });

  const loadPhishingInPhone = (type) => {
    if (type === "whatsapp") {
      browserUrlText.innerText = "https://web.whatsapp.secure-conn.net";
      browserViewportContent.innerHTML = `
        <div class="phish-whatsapp">
          <div class="phish-header-wa">
            <i data-lucide="message-square" style="width:20px;height:20px;color:#fff;"></i>
            <span>WhatsApp Web</span>
          </div>
          <div class="phish-body">
            <div class="wa-qr-status">
              <i data-lucide="shield-alert" class="wa-warn-icon animate-pulse"></i>
              <p class="wa-title">Confirmación Requerida</p>
              <p class="wa-text">Tu sesión de WhatsApp Web está lista para sincronizarse. Presiona vincular para autorizar.</p>
            </div>
            
            <button id="btn-wa-auth" class="btn-wa-action">
              VINCULAR DISPOSITIVO
            </button>
            
            <div class="wa-footer-text font-mono">CODE: WA-8842-CYBERLENS</div>
          </div>
        </div>
      `;
      document.getElementById("btn-wa-auth").addEventListener("click", () => {
        triggerPhishingExploit("WhatsApp Web Client", { code: "WA-8842-CYBERLENS", type: "WhatsApp Clone" });
      });
    } else if (type === "bank") {
      browserUrlText.innerText = "https://online.bancomovil-verify.com";
      browserViewportContent.innerHTML = `
        <div class="phish-bank">
          <div class="bank-bar">
            <i data-lucide="landmark" style="width:22px;height:22px;color:var(--yellow);"></i>
            <span class="font-cyber">BANCA MÓVIL</span>
          </div>
          <div class="bank-body">
            <p class="bank-alert-txt">Se ha detectado un inicio de sesión inusual. Confirma tus credenciales de inmediato.</p>
            
            <div class="bank-input-group">
              <span class="field-lbl">Usuario de Acceso</span>
              <input type="text" id="bank-user" class="bank-input" value="brayanf0" />
            </div>
            <div class="bank-input-group">
              <span class="field-lbl">Clave Secreta (6 dígitos)</span>
              <input type="password" id="bank-pass" class="bank-input" value="884201" />
            </div>
            
            <button id="btn-bank-auth" class="btn-bank-action">
              VALIDAR IDENTIDAD
            </button>
          </div>
        </div>
      `;
      document.getElementById("btn-bank-auth").addEventListener("click", () => {
        const u = document.getElementById("bank-user").value;
        const p = document.getElementById("bank-pass").value;
        triggerPhishingExploit("Banca Móvil Target", { username: u, password: p, portal: "Secure Bank" });
      });
    } else { // wifi
      browserUrlText.innerText = "https://free-airport-guest-wifi.net";
      browserViewportContent.innerHTML = `
        <div class="phish-wifi">
          <div class="wifi-header">
            <i data-lucide="wifi" style="width:28px;height:28px;color:#ef4444;"></i>
            <h3>Airport Guest WiFi</h3>
          </div>
          <div class="wifi-body">
            <p class="wifi-note">Estás a un paso de conectarte a internet de alta velocidad gratis. Inicia sesión con tus credenciales de Google.</p>
            
            <div class="wifi-input-group">
              <input type="text" id="wifi-user" class="wifi-input" placeholder="Correo electrónico" value="brayan.cyber@gmail.com" />
            </div>
            <div class="wifi-input-group">
              <input type="password" id="wifi-pass" class="wifi-input" placeholder="Contraseña de Google" value="brayanPass2026!" />
            </div>
            
            <button id="btn-wifi-auth" class="btn-wifi-action">
              ACCEDER A INTERNET
            </button>
          </div>
        </div>
      `;
      document.getElementById("btn-wifi-auth").addEventListener("click", () => {
        const u = document.getElementById("wifi-user").value;
        const p = document.getElementById("wifi-pass").value;
        triggerPhishingExploit("Airport WiFi Client", { email: u, password: p, ssid: "Airport_Guest_WiFi" });
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  const triggerPhishingExploit = (deviceName, dataCaptured) => {
    // Sound synthesized alarm
    playTone(400, "sawtooth", 0.6, 950);
    setTimeout(() => playTone(400, "sawtooth", 0.6, 950), 400);

    setPhoneState("compromised");
    
    // Pulse desktop status overlay
    const overlayText = qrStatusOverlay.querySelector("span");
    overlayText.innerText = "EXPLOIT INYECTADO. AGENTE CONECTADO.";
    overlayText.className = "font-mono text-red";
    
    // Add to C2 agents database
    addCompromisedAgent(deviceName, dataCaptured);
  };


  // ==========================================
  // MODULE 3: COMMAND & CONTROL (C2) CENTER
  // ==========================================
  const c2AgentsList = document.getElementById("c2-agents-list");
  const c2NoAgentsRow = document.getElementById("c2-no-agents-row");
  const c2ShellTitle = document.getElementById("c2-shell-title");
  const c2TerminalBody = document.getElementById("c2-terminal-body");
  const c2CommandsBar = document.getElementById("c2-commands-bar");
  const c2Badge = document.getElementById("c2-badge");

  let agentsList = [];
  let selectedAgent = null;

  const addCompromisedAgent = (device, capturedData) => {
    const id = `CL-${Math.floor(1000 + Math.random() * 9000)}`;
    const ip = `192.168.43.${Math.floor(2 + Math.random() * 253)}`;
    
    const newAgent = {
      id: id,
      ip: ip,
      device: device,
      ping: Math.floor(10 + Math.random() * 20),
      data: capturedData,
      status: "online"
    };

    agentsList.push(newAgent);
    renderAgentsTable();
  };

  const renderAgentsTable = () => {
    if (agentsList.length === 0) {
      c2NoAgentsRow.classList.remove("hidden");
      return;
    }
    
    c2NoAgentsRow.classList.add("hidden");
    
    // Clear list but retain static styles
    c2AgentsList.innerHTML = agentsList.map(agent => `
      <tr class="agent-row ${selectedAgent && selectedAgent.id === agent.id ? 'active' : ''}" data-id="${agent.id}">
        <td class="font-mono">${agent.id}</td>
        <td class="font-mono">${agent.ip}</td>
        <td>${agent.device}</td>
        <td>
          <span class="agent-status-indicator online"></span>
          <span class="font-mono text-green">${agent.ping}ms</span>
        </td>
      </tr>
    `).join("");

    // Setup Row Click Events
    document.querySelectorAll(".agent-row").forEach(row => {
      row.addEventListener("click", () => {
        const id = row.dataset.id;
        selectC2Agent(id);
      });
    });
  };

  const selectC2Agent = (id) => {
    selectedAgent = agentsList.find(a => a.id === id);
    renderAgentsTable();
    
    c2ShellTitle.innerText = `cyberlens@c2-console: (${selectedAgent.id})`;
    c2CommandsBar.classList.remove("hidden");
    
    c2TerminalBody.innerHTML = `
      <div class="terminal-line success">Conexión establecida con el agente remoto [${selectedAgent.id}]</div>
      <div class="terminal-line info">Dispositivo: ${selectedAgent.device} | IP: ${selectedAgent.ip}</div>
      <div class="terminal-line warning">[ALERTA] Vector de sesión activo. Intercambio de cifrado SSL/TLS completado.</div>
      <div class="terminal-line text">Escribe comandos o presiona los botones rápidos de abajo.</div>
      <div class="terminal-cursor"></div>
    `;
    
    playTone(700, "sine", 0.12);
  };

  // Quick Command Execution
  document.querySelectorAll(".btn-c2-cmd").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!selectedAgent) return;
      const cmd = btn.dataset.cmd;
      runC2Command(cmd);
    });
  });

  const runC2Command = (cmd) => {
    // Remove terminal cursor
    const cursor = c2TerminalBody.querySelector(".terminal-cursor");
    if (cursor) cursor.remove();

    // Command input echo
    const inputLine = document.createElement("div");
    inputLine.className = "terminal-line text";
    inputLine.innerHTML = `<span class="terminal-prompt">></span> run_payload --target=${selectedAgent.id} --command=${cmd}`;
    c2TerminalBody.appendChild(inputLine);

    // Command output processing
    const outputLine = document.createElement("div");
    outputLine.className = "terminal-line info";
    
    playTone(550, "square", 0.08);

    if (cmd === "sysinfo") {
      outputLine.innerHTML = `
        <div style="margin: 8px 0; color:#d1d5db;">
          <b>[SYSTEM METRICS]</b><br>
          Host OS: CyberLensLoader v3.0 (Android Stack)<br>
          CPU: ARM Cortex-A78 Octa-Core @ 2.84 GHz<br>
          System RAM: 5892 MB / 8192 MB (Active)<br>
          System Storage: User folder decrypted (/data/user/0)<br>
          Uptime: 2h 45m 12s | Battery: 94%
        </div>
      `;
    } else if (cmd === "geolocate") {
      const lat = (19.4326 + Math.random() * 0.05).toFixed(6);
      const lon = (-99.1332 - Math.random() * 0.05).toFixed(6);
      outputLine.className = "terminal-line warning";
      outputLine.innerHTML = `
        <div style="margin: 8px 0; color:#facc15;">
          <b>[UBICACIÓN GEOGRÁFICA INTERCEPTADA]</b><br>
          Servicio GPS: Activado (Precisión de Triangulación: 6.2 metros)<br>
          Latitud: ${lat} | Longitud: ${lon}<br>
          Dirección Relativa: Paseo de la Reforma, Ciudad de México, MX<br>
          Map link: https://maps.google.com/?q=${lat},${lon}
        </div>
      `;
    } else if (cmd === "dump_sms") {
      outputLine.className = "terminal-line success";
      outputLine.innerHTML = `
        <div style="margin: 8px 0; color:#4ade80;">
          <b>[SMS LOG DUMP - ÚLTIMOS MENSAJES]</b><br>
          • 10:44 - WhatsApp: "Código de seguridad: 884-201"<br>
          • 10:40 - Banco Alerta: "Compra autorizada por $1500.00 MXN"<br>
          • 10:32 - Contacto (Mamá): "¿Hijo, llegaste bien al aeropuerto? Llámame."<br>
          • 10:28 - SMS Corporativo: "Tu clave de acceso temporal es adminPass2026!"
        </div>
      `;
    } else if (cmd === "trigger_alarm") {
      outputLine.className = "terminal-line error animate-pulse";
      outputLine.innerHTML = `<b>[ALERTA C2] Enviando señal de alarma audible... ¡Sirena física activada en dispositivo objetivo!</b>`;
      // physical noise
      playTone(350, "triangle", 0.6, 900);
      setTimeout(() => playTone(350, "triangle", 0.6, 900), 500);
    }
    
    c2TerminalBody.appendChild(outputLine);
    
    // Restore cursor & scroll
    const newCursor = document.createElement("div");
    newCursor.className = "terminal-cursor";
    c2TerminalBody.appendChild(newCursor);
    c2TerminalBody.scrollTop = c2TerminalBody.scrollHeight;
  };

  // Setup live agents heartbeat ticker
  setInterval(() => {
    if (agentsList.length > 0) {
      agentsList.forEach(agent => {
        // Slightly vary ping
        agent.ping = Math.max(5, agent.ping + Math.floor(Math.random() * 5) - 2);
      });
      renderAgentsTable();
    }
  }, 2500);


  // ==========================================
  // MODULE 4: SQL INJECTION LABORATORY
  // ==========================================
  const sqliUsername = document.getElementById("sqli-username");
  const sqliPassword = document.getElementById("sqli-password");
  const sqlQueryDisplay = document.getElementById("sql-query-display");
  const btnRunSqli = document.getElementById("btn-run-sqli");
  const sqliDbTable = document.getElementById("sqli-db-table");

  const updateSqlQueryString = () => {
    const u = sqliUsername.value;
    const p = sqliPassword.value;
    // highlight quotes and comments nicely
    sqlQueryDisplay.innerHTML = `SELECT * FROM users WHERE username = '<span class="text-cyan">${escapeHTML(u)}</span>' AND password = '<span class="text-purple">${escapeHTML(p)}</span>';`;
  };

  const escapeHTML = (str) => {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  sqliUsername.addEventListener("input", updateSqlQueryString);
  sqliPassword.addEventListener("input", updateSqlQueryString);

  // Quick Payloads
  document.querySelectorAll(".btn-payload-quick").forEach(btn => {
    btn.addEventListener("click", () => {
      const payload = btn.dataset.payload;
      sqliUsername.value = payload;
      sqliPassword.value = "";
      updateSqlQueryString();
      playTone(600, "sine", 0.05);
    });
  });

  btnRunSqli.addEventListener("click", () => {
    const userVal = sqliUsername.value;
    const passVal = sqliPassword.value;
    
    playTone(550, "sine", 0.08);
    sqliDbTable.innerHTML = `<div class="table-placeholder"><i data-lucide="refresh-cw" class="spinner-icon animate-spin"></i> Procesando consulta SQL...</div>`;
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      // Check for SQL Injection patterns
      const isSQLi = userVal.includes("'") || userVal.includes("--") || passVal.includes("'") || passVal.includes("--");
      
      if (isSQLi) {
        playTone(900, "sine", 0.12);
        sqliDbTable.innerHTML = `
          <div class="sqli-success-banner font-mono">
            <i data-lucide="unlock-keyhole" class="text-green"></i> <b>INYECCIÓN SQL EXITOSA (Bypass Lógico)</b>
          </div>
          <table class="db-result-table">
            <thead>
              <tr>
                <th>id</th>
                <th>username</th>
                <th>password_hash</th>
                <th>role</th>
                <th>email</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td class="text-cyan">admin</td>
                <td class="text-yellow">$2y$12$CyLens8842... (hashed)</td>
                <td>superuser</td>
                <td>admin@cyberlens.local</td>
              </tr>
              <tr>
                <td>2</td>
                <td>brayanf0</td>
                <td>$2y$12$f0Brayan8492... (hashed)</td>
                <td>developer</td>
                <td>brayan@cyberlens.local</td>
              </tr>
              <tr>
                <td>3</td>
                <td>invitado</td>
                <td>$2y$12$guestpass991... (hashed)</td>
                <td>user</td>
                <td>guest@cyberlens.local</td>
              </tr>
            </tbody>
          </table>
        `;
      } else {
        playTone(250, "sawtooth", 0.18);
        sqliDbTable.innerHTML = `
          <div class="sqli-error-banner font-mono">
            <i data-lucide="lock" class="text-red"></i> <b>AUTENTICACIÓN RECHAZADA</b>
          </div>
          <p class="db-error-text text-red font-mono">
            MySQL Error: SELECT returned 0 records. Login failed for user "${escapeHTML(userVal)}".
          </p>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }, 700);
  });


  // ==========================================
  // MODULE 5: BRUTE FORCE ARENA
  // ==========================================
  const bruteSpeedSelect = document.getElementById("brute-speed");
  const bruteTargetUser = document.getElementById("brute-target-user");
  const btnStartBrute = document.getElementById("btn-start-brute");
  const btnBruteText = document.getElementById("btn-brute-text");
  const btnResetBrute = document.getElementById("btn-reset-brute");
  
  const bruteStats = document.getElementById("brute-stats");
  const bruteAttemptsCount = document.getElementById("brute-attempts-count");
  const bruteAttemptsSpeed = document.getElementById("brute-attempts-speed");
  const bruteStatusIndicator = document.getElementById("brute-status-indicator");
  const bruteTerminalBody = document.getElementById("brute-terminal-body");

  // Dictionary of passwords to loop through
  const brutePasswords = [
    "123456", "password", "12345678", "qwerty", "admin", "12345", "123456789", 
    "shadow", "dragon", "monkey", "sunshine", "letmein", "superman", "princess", 
    "charles", "oracle", "database", "cybersecurity", "server2026", "secretpass",
    "brayanf0", "cyberleens", "admin12345", "brayan123", "password123", "rootpass",
    "cyberlens" // The correct cracking password!
  ];

  let bruteInterval = null;
  let bruteRunning = false;
  let bruteIndex = 0;
  let bruteCount = 0;
  let bruteStartTime = 0;

  const runBruteForceStep = () => {
    if (!bruteRunning) return;

    if (bruteIndex >= brutePasswords.length) {
      // End of dict and not cracked
      clearInterval(bruteInterval);
      bruteRunning = false;
      bruteStatusIndicator.innerText = "FALLIDO";
      bruteStatusIndicator.className = "text-red";
      btnBruteText.innerText = "Iniciar Ataque";
      playTone(200, "sawtooth", 0.3);
      
      const line = document.createElement("div");
      line.className = "terminal-line error";
      line.innerHTML = `[!] ATAQUE FINALIZADO: Diccionario agotado sin coincidencias.`;
      bruteTerminalBody.appendChild(line);
      bruteTerminalBody.scrollTop = bruteTerminalBody.scrollHeight;
      return;
    }

    const testPassword = brutePasswords[bruteIndex];
    const username = bruteTargetUser.value.trim() || "root";
    bruteCount++;
    
    bruteAttemptsCount.innerText = bruteCount;
    const elapsed = (Date.now() - bruteStartTime) / 1000;
    const speed = Math.round(bruteCount / elapsed);
    bruteAttemptsSpeed.innerText = `${speed} / seg`;

    const isMatch = (testPassword === "cyberlens"); // matches target password
    const attemptLine = document.createElement("div");
    
    if (isMatch) {
      clearInterval(bruteInterval);
      bruteRunning = false;
      bruteStatusIndicator.innerText = "COMPLETADO";
      bruteStatusIndicator.className = "text-green";
      btnBruteText.innerText = "Iniciar Ataque";
      
      // Cracking success alarms
      playTone(880, "sine", 0.15);
      setTimeout(() => playTone(1200, "sine", 0.2), 120);

      attemptLine.className = "terminal-line success";
      attemptLine.innerHTML = `[+] ACCESO DETECTADO: [${username}] con Contraseña: [${testPassword}] -> 200 OK`;
      bruteTerminalBody.appendChild(attemptLine);
      
      // Success alert panel
      const summary = document.createElement("div");
      summary.className = "brute-success-alert font-mono";
      summary.innerHTML = `
        <div style="font-size:1.1rem;margin-bottom:4px;"><b>★ CREDENCIAL ENCONTRADA ★</b></div>
        Usuario: <span class="text-cyan">${username}</span><br>
        Contraseña: <span class="text-green">${testPassword}</span>
      `;
      bruteTerminalBody.appendChild(summary);
    } else {
      playTone(400, "sine", 0.02);
      attemptLine.className = "terminal-line text";
      attemptLine.innerHTML = `<span class="text-muted">[PROBANDO]</span> ${username} : ${testPassword} -> 401 Unauthorized`;
      bruteTerminalBody.appendChild(attemptLine);
      bruteIndex++;
    }

    bruteTerminalBody.scrollTop = bruteTerminalBody.scrollHeight;
  };

  btnStartBrute.addEventListener("click", () => {
    if (bruteRunning) {
      // Pause/Stop
      clearInterval(bruteInterval);
      bruteRunning = false;
      bruteStatusIndicator.innerText = "PAUSADO";
      bruteStatusIndicator.className = "text-yellow";
      btnBruteText.innerText = "Iniciar Ataque";
      playTone(330, "sine", 0.1);
      return;
    }

    // Start
    const placeholder = bruteTerminalBody.querySelector(".terminal-placeholder");
    if (placeholder) placeholder.remove();

    bruteRunning = true;
    bruteStats.classList.remove("hidden");
    bruteStatusIndicator.innerText = "CRACKEANDO";
    bruteStatusIndicator.className = "text-yellow";
    btnBruteText.innerText = "Detener Ataque";
    
    bruteStartTime = Date.now();
    playTone(520, "sine", 0.08);

    const speedMs = parseInt(bruteSpeedSelect.value);
    bruteInterval = setInterval(runBruteForceStep, speedMs);
  });

  const resetBruteForce = () => {
    clearInterval(bruteInterval);
    bruteRunning = false;
    bruteIndex = 0;
    bruteCount = 0;
    
    btnBruteText.innerText = "Iniciar Ataque";
    bruteStats.classList.add("hidden");
    bruteAttemptsCount.innerText = "0";
    bruteAttemptsSpeed.innerText = "0 / seg";
    
    bruteTerminalBody.innerHTML = `
      <div class="terminal-placeholder">
        $ Esperando para iniciar el ataque de diccionario...
      </div>
    `;
    
    playTone(300, "sine", 0.1);
  };

  btnResetBrute.addEventListener("click", resetBruteForce);
});

// Extra spinner rotation for CSS spinner loaded in JS
const spinnerStyle = document.createElement("style");
spinnerStyle.innerHTML = `
  @keyframes spinSpeed {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);
