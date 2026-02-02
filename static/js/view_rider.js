const isLoggedIn = "{{ session.get('email', '') }}" !== "";

// Get rider email - try multiple methods to ensure we get the actual email
function getRiderEmail() {
  // Method 1: Try to get from data attribute
  const riderData = document.querySelector("[data-rider-email]");
  if (riderData) {
    const email = riderData.getAttribute("data-rider-email");
    if (email && !email.includes("{{") && !email.includes("{%")) {
      return email;
    }
  }

  // Method 2: Get from URL (most reliable)
  const urlParts = window.location.pathname.split("/");
  const riderIndex = urlParts.indexOf("view_rider");
  if (riderIndex !== -1 && urlParts[riderIndex + 1]) {
    const email = decodeURIComponent(urlParts[riderIndex + 1]);
    if (email && !email.includes("{{") && !email.includes("{%")) {
      return email;
    }
  }

  // Method 3: Try Jinja template (should be rendered server-side)
  const templateEmail = "{{ rider.email }}";
  if (
    templateEmail &&
    !templateEmail.includes("{{") &&
    !templateEmail.includes("{%")
  ) {
    return templateEmail;
  }

  console.error("Could not determine rider email");
  return null;
}

const riderEmail = getRiderEmail();

// Report Rider Functions
function openReportModal() {
  if (!isLoggedIn) {
    alert("Please login to report a rider");
    window.location.href = "/login";
    return;
  }
  const modal = document.getElementById("reportModal");
  modal.style.display = "flex";
  modal.classList.add("show");
}

function closeReportModal() {
  const modal = document.getElementById("reportModal");
  modal.style.display = "none";
  modal.classList.remove("show");
  document.getElementById("reportForm").reset();
}

function submitReport(event) {
  event.preventDefault();

  // Get rider email using the function
  const currentRiderEmail = getRiderEmail();

  if (
    !currentRiderEmail ||
    currentRiderEmail.includes("{{") ||
    currentRiderEmail.includes("{%")
  ) {
    alert(
      "Error: Could not determine rider email. Please refresh the page and try again."
    );
    console.error("Invalid rider email:", currentRiderEmail);
    return;
  }

  const formData = new FormData(event.target);
  const reportData = {
    reported_rider_email: currentRiderEmail,
    report_reason: formData.get("report_reason"),
    report_description: formData.get("report_description"),
  };

  console.log("Submitting report for rider:", currentRiderEmail);

  fetch("/submit_rider_report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Report submitted successfully! Our admin team will review it.");
        closeReportModal();
      } else {
        alert(data.message || "Error submitting report. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    });
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("reportModal");
  if (event.target === modal) {
    closeReportModal();
  }
};

// Profile Picture Upload
function uploadProfilePic(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.match("image.*")) {
    alert("Please select an image file");
    return;
  }

  const formData = new FormData();
  formData.append("profile_pic", file);

  // Show loading state
  const img = document.getElementById("profilePicImg");
  const originalSrc = img.src;
  img.style.opacity = "0.5";

  fetch("/upload_profile_pic", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        img.src = data.image_url + "?t=" + new Date().getTime();
        img.style.opacity = "1";
        alert("Profile picture updated successfully!");
      } else {
        img.style.opacity = "1";
        alert(data.error || "Error uploading profile picture");
      }
    })
    .catch((error) => {
      img.style.opacity = "1";
      console.error("Error:", error);
      alert("Error uploading profile picture");
    });
}

// Banner Upload
function uploadBanner(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.match("image.*")) {
    alert("Please select an image file");
    return;
  }

  const formData = new FormData();
  formData.append("banner", file);

  // Show loading state
  const banner = document.querySelector(".rider-banner");
  const originalSrc = banner.src;
  banner.style.opacity = "0.5";

  fetch("/upload_banner", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        banner.src = data.image_url + "?t=" + new Date().getTime();
        banner.style.opacity = "1";
        alert("Banner updated successfully!");
      } else {
        banner.style.opacity = "1";
        alert(data.error || "Error uploading banner");
      }
    })
    .catch((error) => {
      banner.style.opacity = "1";
      console.error("Error:", error);
      alert("Error uploading banner");
    });
}
