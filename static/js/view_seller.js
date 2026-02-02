const isLoggedIn = "{{ session.get('email', '') }}" !== "";

// Get seller email - try multiple methods to ensure we get the actual email
function getSellerEmail() {
  // Method 1: Try to get from data attribute
  const sellerData = document.querySelector("[data-seller-email]");
  if (sellerData) {
    const email = sellerData.getAttribute("data-seller-email");
    if (email && !email.includes("{{") && !email.includes("{%")) {
      return email;
    }
  }

  // Method 2: Get from URL (most reliable)
  const urlParts = window.location.pathname.split("/");
  const sellerIndex = urlParts.indexOf("view_seller");
  if (sellerIndex !== -1 && urlParts[sellerIndex + 1]) {
    const email = decodeURIComponent(urlParts[sellerIndex + 1]);
    if (email && !email.includes("{{") && !email.includes("{%")) {
      return email;
    }
  }

  // Method 3: Try Jinja template (should be rendered server-side)
  const templateEmail = "{{ seller.email }}";
  if (
    templateEmail &&
    !templateEmail.includes("{{") &&
    !templateEmail.includes("{%")
  ) {
    return templateEmail;
  }

  console.error("Could not determine seller email");
  return null;
}

const sellerEmail = getSellerEmail();

function addToCart(productId, name, price, image, color) {
  if (!isLoggedIn) {
    window.location.href = "/login";
    return;
  }

  fetch("/add-to-cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name: name,
      price: price,
      image: image,
      color: color,
      quantity: 1,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Product added to cart!");
      } else {
        alert(data.message || "Error adding to cart");
      }
    });
}

function addToWishlist(productId, name, price, image) {
  if (!isLoggedIn) {
    window.location.href = "/login";
    return;
  }

  fetch("/add_to_wishlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name: name,
      price: price,
      image: image,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Product added to wishlist!");
      } else {
        alert(data.message || "Error adding to wishlist");
      }
    });
}

// Report Seller Functions
function openReportModal() {
  if (!isLoggedIn) {
    alert("Please login to report a seller");
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

  // Get seller email using the function
  const currentSellerEmail = getSellerEmail();

  if (
    !currentSellerEmail ||
    currentSellerEmail.includes("{{") ||
    currentSellerEmail.includes("{%")
  ) {
    alert(
      "Error: Could not determine seller email. Please refresh the page and try again."
    );
    console.error("Invalid seller email:", currentSellerEmail);
    return;
  }

  const formData = new FormData(event.target);
  const reportData = {
    reported_seller_email: currentSellerEmail,
    report_reason: formData.get("report_reason"),
    report_description: formData.get("report_description"),
  };

  console.log("Submitting report for seller:", currentSellerEmail);

  fetch("/submit_report", {
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
