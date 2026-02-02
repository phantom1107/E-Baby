function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const newscreenbody = document.querySelector(".newscreenbody");
  const toggleIcon = document.querySelector(".sidebar-toggle i");

  sidebar.classList.toggle("collapsed");
  newscreenbody.classList.toggle("expanded");

  // Update the icon based on sidebar state
  if (sidebar.classList.contains("collapsed")) {
    toggleIcon.classList.remove("fa-chevron-left");
    toggleIcon.classList.add("fa-chevron-right");
  } else {
    toggleIcon.classList.remove("fa-chevron-right");
    toggleIcon.classList.add("fa-chevron-left");
  }

  localStorage.setItem(
    "sidebarCollapsed",
    sidebar.classList.contains("collapsed")
  );
}

function restoreSidebarState() {
  const sidebar = document.querySelector(".sidebar");
  const newscreenbody = document.querySelector(".newscreenbody");
  const toggleIcon = document.querySelector(".sidebar-toggle i");
  const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";

  if (isCollapsed) {
    sidebar.classList.add("collapsed");
    newscreenbody.classList.add("expanded");
    toggleIcon.classList.remove("fa-chevron-left");
    toggleIcon.classList.add("fa-chevron-right");
  }
}

document.addEventListener("DOMContentLoaded", restoreSidebarState);

const modal = document.getElementById("editProductModal");
const span = document.getElementsByClassName("close")[0];

function openEditModal(
  id,
  name,
  description,
  price,
  quantity,
  category,
  size,
  color,
  image
) {
  modal.style.display = "block";
  document.getElementById("editProductId").value = id;
  document.getElementById("editName").value = name;
  document.getElementById("editDescription").value = description;
  document.getElementById("editPrice").value = price;
  document.getElementById("editQuantity").value = quantity;
  document.getElementById("editCategory").value = category;
  document.getElementById("editSize").value = size;
  document.getElementById("editColor").value = color;
  document.getElementById("currentImage").src = image;
}

function closeEditModal() {
  modal.style.display = "none";
}

span.onclick = closeEditModal;

window.onclick = function (event) {
  if (event.target == modal) {
    closeEditModal();
  }
};

function confirmDelete(productId) {
  if (confirm("Are you sure you want to delete this product?")) {
    // Send delete request to server
    fetch(`/delete_product/${productId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Show success message
          alert("Product deleted successfully!");
          // Refresh the page or remove the product element
          location.reload();
        } else {
          alert("Error deleting product: " + (data.error || "Unknown error"));
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error deleting product. Please try again.");
      });
  }
}

// Handle form submission
document.getElementById("editProductForm").onsubmit = function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const productId = formData.get("product_id");

  fetch(`/update_products/${productId}`, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (response.redirected) {
        // If the response is a redirect, follow it
        window.location.href = response.url;
      } else {
        return response.json();
      }
    })
    .then((data) => {
      if (data.success) {
        closeEditModal();
        location.reload();
      } else {
        alert("Error updating product");
      }
    });
};

function previewImage(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("currentImage").src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Logout functionality - use centralized logout function
function confirmLogout() {
  logout();
}
