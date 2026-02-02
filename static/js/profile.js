function enableEditing() {
  // Enable input fields
  const inputs = document.querySelectorAll(".editable");
  inputs.forEach((input) => (input.disabled = false));

  // Show update button, hide edit button
  document.getElementById("editButton").style.display = "none";
  document.getElementById("updateButton").style.display = "block";

  // Show image edit buttons
  document.querySelector(".edit-banner").style.display = "flex";
  document.querySelector(".edit-profile-pic").style.display = "flex";
}

function uploadProfilePic(input) {
  if (input.files && input.files[0]) {
    const formData = new FormData();
    formData.append("profile_pic", input.files[0]);

    fetch("/upload_profile_pic", {
      method: "POST",
      body: formData,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          document.querySelector(".profile-pic").src = data.image_url;
        } else {
          alert("Failed to upload profile picture: " + data.error);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while uploading the profile picture");
      });
  }
}

function uploadBanner(input) {
  if (input.files && input.files[0]) {
    const formData = new FormData();
    formData.append("banner", input.files[0]);

    fetch("/upload_banner", {
      method: "POST",
      body: formData,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          document.querySelector(".profile-banner").src = data.image_url;
        } else {
          alert("Failed to upload banner: " + data.error);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while uploading the banner");
      });
  }
}

// Handle form submission - allow normal form submission
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector('form[method="POST"]');
  if (form) {
    form.addEventListener("submit", function (e) {
      // Check if we're in edit mode
      const editables = document.querySelectorAll(".editable");
      let isEditing = false;
      editables.forEach((input) => {
        if (!input.disabled) {
          isEditing = true;
        }
      });

      if (isEditing) {
        // Allow form to submit normally - don't prevent default
        // The form will submit to /profile POST route
        return true;
      }
    });
  }
});

// Load rider statistics if user is a rider
document.addEventListener("DOMContentLoaded", function () {
  const riderSection = document.querySelector(".rider-info-section");
  if (riderSection) {
    loadRiderStats();
  }
});

function loadRiderStats() {
  fetch("/api/rider_stats")
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error("Error loading rider stats:", data.error);
        return;
      }

      // Update the statistics display
      document.getElementById("total-deliveries").textContent =
        data.total_deliveries || 0;
      document.getElementById("pending-orders").textContent =
        data.pending_orders || 0;
      document.getElementById("total-earnings").textContent = `₱${(
        data.total_earnings || 0
      ).toFixed(2)}`;
      document.getElementById("rider-rating").textContent = (
        data.rating || 5.0
      ).toFixed(1);
    })
    .catch((error) => {
      console.error("Error loading rider stats:", error);
    });
}
