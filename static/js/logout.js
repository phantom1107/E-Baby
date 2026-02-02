// scripts.js
function logout() {
  // Show loading screen
  showLogoutLoading();

  fetch("/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Show success message
        showLogoutSuccess();
        // Redirect after showing success message
        setTimeout(() => {
          window.location.replace(data.redirect || "/");
        }, 2000);
      } else {
        hideLogoutLoading();
        alert("Logout failed: " + (data.message || "Please try again"));
      }
    })
    .catch((error) => {
      hideLogoutLoading();
      console.error("Error during logout:", error);
      alert("Logout failed. Please try again.");
    });
}

function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.classList.toggle("active");
  }
}

function showLogoutLoading() {
  // Remove any existing overlay
  hideLogoutLoading();

  // Create loading overlay
  const overlay = document.createElement("div");
  overlay.id = "logoutLoadingOverlay";
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

  const loadingBox = document.createElement("div");
  loadingBox.style.cssText = `
        background: white;
        padding: 3rem 3.5rem;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        min-width: 280px;
    `;

  const spinner = document.createElement("div");
  spinner.style.cssText = `
        width: 60px;
        height: 60px;
        margin: 0 auto 1.5rem;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #7C3AED;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;

  const text = document.createElement("p");
  text.id = "logoutLoadingText";
  text.textContent = "Logging out...";
  text.style.cssText = `
        margin: 0;
        font-size: 1.2rem;
        color: #333;
        font-weight: 600;
    `;

  loadingBox.appendChild(spinner);
  loadingBox.appendChild(text);
  overlay.appendChild(loadingBox);
  document.body.appendChild(overlay);

  // Add animation styles if not already present
  if (!document.getElementById("logoutSpinnerStyle")) {
    const style = document.createElement("style");
    style.id = "logoutSpinnerStyle";
    style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            #logoutLoadingOverlay {
                animation: fadeIn 0.3s ease;
            }
        `;
    document.head.appendChild(style);
  }
}

function showLogoutSuccess() {
  const overlay = document.getElementById("logoutLoadingOverlay");
  if (!overlay) return;

  const loadingBox = overlay.querySelector("div");
  const spinner = loadingBox.querySelector("div");
  const text = document.getElementById("logoutLoadingText");

  // Remove spinner
  if (spinner) {
    spinner.remove();
  }

  // Update text to success message
  if (text) {
    text.textContent = "Logout successfully!";
    text.style.cssText = `
            margin: 0;
            font-size: 1.2rem;
            color: #10B981;
            font-weight: 600;
        `;
  }

  // Add success icon
  const successIcon = document.createElement("div");
  successIcon.innerHTML =
    '<i class="fas fa-check-circle" style="font-size: 4rem; color: #10B981; margin-bottom: 1rem;"></i>';
  successIcon.style.cssText = `
        animation: fadeIn 0.5s ease;
    `;
  loadingBox.insertBefore(successIcon, text);
}

function hideLogoutLoading() {
  const overlay = document.getElementById("logoutLoadingOverlay");
  if (overlay) {
    overlay.remove();
  }
}
