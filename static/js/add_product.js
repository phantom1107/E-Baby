function initializePage() {
  // Show flash message function
  function showFlashMessage(message, type) {
    const notification = document.createElement("div");
    notification.className = `flash-message flash-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Function to confirm adding the product
  function confirmAddProduct(event) {
    event.preventDefault(); // Prevent form submission
    const confirmation = confirm("Are you sure you want to add this item?");
    if (confirmation) {
      // If the user confirmed, submit the form
      event.target.closest("form").submit();
    }
  }

  // Preview image function
  function previewImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    const previewArea =
      event.target.parentElement.querySelector(".preview-area");
    const defaultUploadState = previewArea.querySelector(
      ".default-upload-state"
    );

    reader.onload = function (e) {
      // Hide the default upload state
      if (defaultUploadState) {
        defaultUploadState.style.display = "none";
      }

      // Set the preview image
      previewArea.style.backgroundImage = `url(${e.target.result})`;
      previewArea.style.backgroundSize = "contain";
      previewArea.style.backgroundRepeat = "no-repeat";
      previewArea.style.backgroundPosition = "center";
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  }

  // Toggle sidebar function
  function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.toggle("collapsed");

    // Save state to localStorage
    localStorage.setItem(
      "sidebarCollapsed",
      sidebar.classList.contains("collapsed")
    );
  }

  // Restore sidebar state on page load
  document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";

    if (isCollapsed) {
      sidebar.classList.add("collapsed");
    }
  });

  // Modal handling
  const modal = document.getElementById("productExistsModal");
  const span = document.getElementsByClassName("close")[0];

  // Close modal when clicking X
  span.onclick = function () {
    modal.style.display = "none";
  };

  // Close modal when clicking outside
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  // Add event listeners
  document
    .querySelector('input[type="file"]')
    .addEventListener("change", previewImage);
  document
    .querySelector('button[type="submit"]')
    .addEventListener("click", confirmAddProduct);
  document
    .querySelector(".sidebar-toggle")
    .addEventListener("click", toggleSidebar);

  // Dynamic field toggling based on category
  const categorySelect = document.getElementById("categorySelect");
  const sizesSection = document.getElementById("sizesSection");
  const colorsSection = document.getElementById("colorsSection");
  const sizesSelect = document.getElementById("sizesSelect");
  const colorsSelect = document.getElementById("colorsSelect");

  function setFieldRequired(element, isRequired) {
    if (!element) return;
    if (isRequired) {
      element.setAttribute("required", "required");
    } else {
      element.removeAttribute("required");
    }
  }

  function toggleFields() {
    const category = categorySelect ? categorySelect.value : "";
    // Categories that typically use sizes/colors (clothing)
    const clothingCategories = ["Baby Clothes & Accessories"];

    // Categories that don't need sizes; colors optional or N/A
    const nonSizedCategories = [
      "Toys & Games",
      "Educational Materials",
      "Strollers & Gear",
      "Nursery Furniture",
      "Safety and Health",
    ];

    if (clothingCategories.includes(category)) {
      // Show sizes/colors, make them required
      if (sizesSection) sizesSection.style.display = "";
      if (colorsSection) colorsSection.style.display = "";
      setFieldRequired(sizesSelect, true);
      setFieldRequired(colorsSelect, true);
    } else if (nonSizedCategories.includes(category)) {
      // Hide sizes, make not required; colors optional (show but not required)
      if (sizesSection) sizesSection.style.display = "none";
      setFieldRequired(sizesSelect, false);
      if (sizesSelect) sizesSelect.value = "";

      if (colorsSection) colorsSection.style.display = "";
      setFieldRequired(colorsSelect, false);
    } else {
      // Default state
      if (sizesSection) sizesSection.style.display = "";
      if (colorsSection) colorsSection.style.display = "";
      setFieldRequired(sizesSelect, true);
      setFieldRequired(colorsSelect, true);
    }
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", toggleFields);
    // Initialize on load
    toggleFields();
  }
}

// Logout functionality - use centralized logout function
function confirmLogout() {
  logout();
}

// Initialize everything when the window loads
window.onload = initializePage;
