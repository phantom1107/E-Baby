// Function to show the "Item Added" modal
function showItemAddedModal() {
  document.getElementById("itemAddedModal").style.display = "block";
}

// Function to show the "Out of Stock" modal
function showOutOfStockModal() {
  alert("❌ This product is out of stock and cannot be added to your cart. Please choose another product.");
}

// Function to show the "Insufficient Stock" modal
function showInsufficientStockModal(available) {
  alert(`❌ Not enough stock available.\n\nOnly ${available} item(s) available. Please reduce your quantity.`);
}

// Function to close modals
function closeModal() {
  document.getElementById("itemAddedModal").style.display = "none";
}

// Change main product image
function changeImage(thumbnail) {
  const mainImage = document.getElementById("productImage");
  const thumbnails = document.querySelectorAll(".thumbnail");

  // Update active thumbnail
  thumbnails.forEach((t) => t.classList.remove("active"));
  thumbnail.classList.add("active");

  // Change main image
  mainImage.src = thumbnail.querySelector("img").src;
}

// Update quantity
function updateQuantity(change) {
  const quantityInput = document.getElementById("quantity");
  let currentValue = parseInt(quantityInput.value);
  const newValue = currentValue + change;
  const maxQuantity = parseInt(quantityInput.max);

  if (newValue >= 1 && newValue <= maxQuantity) {
    quantityInput.value = newValue;
  }
}

// Modified addToCart function to show the "Item Added" modal
function addToCart(event) {
  const form = document.getElementById("addToCartForm");
  const formData = new FormData(form);

  // Create image for animation
  const img = document.createElement("img");
  img.src = document.getElementById("productImage").src;
  img.classList.add("image-float");
  img.style.width = "50px";
  img.style.height = "50px";
  document.body.appendChild(img);

  // Get the cart icon position for the animation
  const cartIcon = document.querySelector(
    '.header-icon[title="Shopping Cart"]'
  );
  const rect = cartIcon.getBoundingClientRect();
  img.style.position = "fixed";
  img.style.left = `${event.clientX - 25}px`;
  img.style.top = `${event.clientY - 25}px`;
  img.style.zIndex = "1001";

  setTimeout(() => {
    img.style.transition = "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    img.style.transform = `translate(${rect.left - 25}px, ${
      rect.top - 25
    }px) scale(0.2)`;
    img.style.opacity = "0";
  }, 10);

  // Make the AJAX request to add to cart
  fetch("/add-to-cart", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      // Remove the animated image once the request is complete
      setTimeout(() => img.remove(), 600);

      if (data.outOfStock) {
        showOutOfStockModal(); // Show out of stock message
      } else if (data.insufficientStock) {
        showInsufficientStockModal(data.available); // Show insufficient stock message
      } else if (data.success) {
        showItemAddedModal(); // Show the item added modal
      } else {
        alert("Error: " + (data.message || "Could not add item to cart"));
      }
    })
    .catch((error) => {
      img.remove();
      console.error("Error adding item to cart:", error);
    });
}

// Checkout product function
function checkoutProduct() {
  const form = document.getElementById("addToCartForm");
  const formData = new FormData(form);

  fetch("/checkout-product", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "/checkout";
      } else {
        alert("Error: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred");
    });
}

// Logout functionality - use centralized logout function
function confirmLogout() {
  logout();
}
