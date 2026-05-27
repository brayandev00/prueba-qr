// CyberLens Interactive Logic

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

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
      }
    });
  });

  // --- Scanner Simulator ---
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

  // Helper: Delay execution
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper: Write a line to the terminal
  const addTerminalLine = (text, type = "text") => {
    // Remove placeholder on first line
    const placeholder = terminalBody.querySelector(".terminal-placeholder");
    if (placeholder) {
      placeholder.remove();
    }

    const line = document.createElement("div");
    line.className = `terminal-line ${type}`;
    line.innerHTML = `<span class="terminal-prompt">$</span> ${text}`;
    terminalBody.appendChild(line);
    
    // Auto-scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;
  };

  // Helper: Add flashing terminal cursor
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

  // Helper: Get severity badge HTML class & content
  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "critical": return "critical";
      case "high": return "high";
      case "medium": return "medium";
      case "low": return "low";
      default: return "";
    }
  };

  // Helper: Get risk color class for ports
  const getRiskColorClass = (risk) => {
    switch (risk) {
      case "high": return "text-red";
      case "medium": return "text-yellow";
      case "low": return "text-green";
      default: return "text-muted";
    }
  };

  // Simulator Main Scan Flow
  const simulateScan = async () => {
    const domain = domainInput.value.trim();
    if (!domain) {
      addTerminalLine("[ERROR] Por favor ingresa un dominio válido", "error");
      return;
    }

    isScanning = true;
    
    // Toggle element states
    domainInput.disabled = true;
    btnStartScan.disabled = true;
    btnStartScan.classList.add("opacity-50");
    btnScanText.innerText = "Escaneando...";
    btnStartScan.querySelector(".btn-icon").outerHTML = '<div class="btn-icon spinner-small" style="width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spinSpeed 0.8s linear infinite;"></div>';
    
    // Reset lists/outputs
    terminalBody.innerHTML = "";
    subdomainsList.innerHTML = "";
    portsList.innerHTML = "";
    vulnerabilitiesList.innerHTML = "";
    
    quickStats.classList.add("hidden");
    resultsDashboard.classList.add("hidden");
    
    // Show and reset progress
    progressContainer.classList.remove("hidden");
    progressBarFill.style.width = "0%";
    progressPercent.innerText = "0%";
    
    subdomainResults = [];
    portResults = [];
    vulnerabilityResults = [];

    // --- Phase 1: Subdomains ---
    scanPhaseText.innerText = "Buscando subdominios...";
    addTerminalLine("Iniciando CyberLens v2.0...", "info");
    await delay(500);
    addTerminalLine(`Objetivo: ${domain}`, "text");
    await delay(300);
    addTerminalLine("Buscando subdominios...", "info");
    showTerminalCursor(true);

    const subdomainsData = [
      { name: `api.${domain}`, ip: "192.168.1.100" },
      { name: `dev.${domain}`, ip: "192.168.1.101" },
      { name: `staging.${domain}`, ip: "192.168.1.102" },
      { name: `admin.${domain}`, ip: "192.168.1.103" },
      { name: `mail.${domain}`, ip: "192.168.1.104" },
      { name: `cdn.${domain}`, ip: "192.168.1.105" }
    ];

    for (let i = 0; i < subdomainsData.length; i++) {
      if (!isScanning) return; // check if cancelled mid-scan
      await delay(400);
      showTerminalCursor(false);
      
      const sub = subdomainsData[i];
      subdomainResults.push(sub);
      addTerminalLine(`[+] Subdominio encontrado: ${sub.name}`, "success");
      
      // Update Progress
      const progress = Math.round(((i + 1) / subdomainsData.length) * 30);
      progressBarFill.style.width = `${progress}%`;
      progressPercent.innerText = `${progress}%`;
      
      showTerminalCursor(true);
    }

    // --- Phase 2: Ports ---
    if (!isScanning) return;
    scanPhaseText.innerText = "Escaneando puertos...";
    showTerminalCursor(false);
    await delay(500);
    addTerminalLine("Escaneando puertos abiertos...", "info");
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
      
      // Update Progress
      const progress = 30 + Math.round(((i + 1) / portsData.length) * 35);
      progressBarFill.style.width = `${progress}%`;
      progressPercent.innerText = `${progress}%`;
      
      showTerminalCursor(true);
    }

    // --- Phase 3: Vulnerabilities ---
    if (!isScanning) return;
    scanPhaseText.innerText = "Detectando vulnerabilidades...";
    showTerminalCursor(false);
    await delay(500);
    addTerminalLine("Detectando vulnerabilidades...", "info");
    showTerminalCursor(true);

    const vulnerabilitiesData = [
      { id: "CVE-2024-1234", name: "SQL Injection", severity: "critical", description: "Inyección SQL en endpoint /api/users" },
      { id: "CVE-2024-5678", name: "XSS Reflejado", severity: "high", description: "Cross-Site Scripting en parámetro search" },
      { id: "CVE-2024-9012", name: "Headers Faltantes", severity: "medium", description: "Faltan headers de seguridad CSP y X-Frame-Options" },
      { id: "CVE-2024-3456", name: "SSL/TLS Débil", severity: "medium", description: "Soporte para TLS 1.0 detectado" },
      { id: "CVE-2024-7890", name: "Info Disclosure", severity: "low", description: "Versión de servidor expuesta en headers" }
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
      
      // Update Progress
      const progress = 65 + Math.round(((i + 1) / vulnerabilitiesData.length) * 35);
      progressBarFill.style.width = `${progress}%`;
      progressPercent.innerText = `${progress}%`;
      
      showTerminalCursor(true);
    }

    // --- Phase 4: Complete ---
    if (!isScanning) return;
    showTerminalCursor(false);
    await delay(500);
    
    progressBarFill.style.width = "100%";
    progressPercent.innerText = "100%";
    scanPhaseText.innerText = "Escaneo completado";
    
    addTerminalLine("Escaneo completado", "success");
    const openPortsCount = portResults.filter(p => p.status === "open").length;
    addTerminalLine(`[REPORT] ${subdomainResults.length} subdominios | ${openPortsCount} puertos abiertos | ${vulnerabilityResults.length} vulnerabilidades`, "success");
    
    // Render Results Dashboard HTML
    renderResults();
    
    // Show stats and dashboard panels
    quickStats.classList.remove("hidden");
    resultsDashboard.classList.remove("hidden");
    
    // Reset controls
    restoreScanButtons();
    isScanning = false;
  };

  // Helper: Restore original button states
  const restoreScanButtons = () => {
    domainInput.disabled = false;
    btnStartScan.disabled = false;
    btnStartScan.classList.remove("opacity-50");
    btnScanText.innerText = "Iniciar Reconocimiento";
    
    // Replace spinner icon with play icon
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

  // Populate Dashboard DOM
  const renderResults = () => {
    // 1. Stats Numbers
    statSubdomains.innerText = subdomainResults.length;
    statPorts.innerText = portResults.filter(p => p.status === "open").length;
    statVulns.innerText = vulnerabilityResults.length;

    // 2. Subdomains List
    subdomainsList.innerHTML = subdomainResults.map(sub => `
      <div class="list-item-subdomain">
        <span class="subdomain-name">${sub.name}</span>
        <span class="subdomain-ip">${sub.ip}</span>
      </div>
    `).join("");

    // 3. Ports List
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

    // 4. Vulnerabilities List
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

  // Reset Simulation Action
  const resetScan = () => {
    isScanning = false;
    
    // Reset states and styles
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
    
    // Clear lists
    subdomainsList.innerHTML = "";
    portsList.innerHTML = "";
    vulnerabilitiesList.innerHTML = "";
    
    // Clear and restore terminal placeholder
    terminalBody.innerHTML = `
      <div class="terminal-placeholder">
        <span class="terminal-prompt">$</span> Esperando comando...
      </div>
    `;
    
    domainInput.value = "";
  };

  // Event Listeners
  btnStartScan.addEventListener("click", () => {
    if (!isScanning) {
      simulateScan();
    }
  });

  btnResetScan.addEventListener("click", resetScan);

  // Allow press enter to start scan
  domainInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !isScanning) {
      simulateScan();
    }
  });
});

// Custom spinner animation injection for JS-based spinner
const style = document.createElement("style");
style.innerHTML = `
  @keyframes spinSpeed {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
