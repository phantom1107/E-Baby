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

  // Set form action
  form.action = `/update_users/${user.id}`;

  modal.style.display = "block";
}

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
