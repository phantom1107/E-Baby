function confirmLogout() {
  // Use centralized logout function
  logout();
}

function openEditModal(user) {
  const modal = document.getElementById("editModal");
  const form = document.getElementById("editForm");

  // Display current information
  document.getElementById("currentFirstName").textContent = user.first_name;
  document.getElementById("currentLastName").textContent = user.last_name;
  document.getElementById("currentEmail").textContent = user.email;
  document.getElementById("currentPhone").textContent = user.phone_number;
  document.getElementById("currentAddress").textContent = user.address;
  document.getElementById("currentUserType").textContent = user.user_type;

  // Set form values
  form.first_name.value = user.first_name;
  form.last_name.value = user.last_name;
  form.email.value = user.email;
  form.phone_number.value = user.phone_number;
  form.address.value = user.address;
  form.user_type.value = user.user_type;

  // Store user ID for form submission
  form.dataset.userId = user.id;

  modal.style.display = "block";
}

// Handle form submission
document.getElementById("editForm").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const userId = this.dataset.userId;
  const formData = new FormData(this);
  
  fetch(`/update/${userId}`, {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
  })
  .then(html => {
    // Show success message
    alert('User updated successfully!');
    document.getElementById("editModal").style.display = "none";
    // Reload the page to see updated data
    location.reload();
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error updating user: ' + error.message);
  });
});

// Close modal when clicking the X
document.querySelector(".close").onclick = function () {
  document.getElementById("editModal").style.display = "none";
};

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("editModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

function confirmDelete() {
  return confirm("Are you sure you want to delete this user?");
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const container = document.querySelector(".dashboard-container");
  sidebar.classList.toggle("collapsed");
  container.classList.toggle("expanded");

  // Rotate arrow icon
  const icon = document.querySelector(".sidebar-toggle i");
  if (sidebar.classList.contains("collapsed")) {
    icon.style.transform = "rotate(180deg)";
  } else {
    icon.style.transform = "rotate(0deg)";
  }
}
