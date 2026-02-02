// Admin Reports Management JavaScript

let currentReportId = null;
let currentStatusFilter = "all";
let setupReportButtonListeners = null; // Will be defined later

// Load reports on page load - only if we're on the seller-reports section
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on the seller-reports section
  const sellerReportsSection = document.getElementById(
    "seller-reports-section"
  );
  if (
    sellerReportsSection &&
    sellerReportsSection.classList.contains("active")
  ) {
    loadReports();
  }

  // Also load when section becomes active
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const section = document.getElementById("seller-reports-section");
        if (section && section.classList.contains("active")) {
          const tbody = document.getElementById("reportsTableBody");
          // Load reports if table is empty or showing loading message
          if (
            !tbody ||
            tbody.innerHTML.includes("Loading") ||
            tbody.innerHTML.includes("No reports")
          ) {
            loadReports(currentStatusFilter || "all");
          }
        }
      }
    });
  });

  // Set up observer after a short delay to ensure DOM is ready
  setTimeout(() => {
    const section = document.getElementById("seller-reports-section");
    if (section) {
      observer.observe(section, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  }, 500);

  // Set up listeners after a short delay to ensure DOM is ready
  setTimeout(setupReportButtonListeners, 300);
});

// Load reports from API
function loadReports(status = "all") {
  currentStatusFilter = status;
  const statusParam = status === "all" ? "" : `?status=${status}`;

  fetch(`/api/reports${statusParam}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success && data.reports) {
        displayReports(data.reports);
        updateFilterButtons(status);
      } else {
        console.error("API returned error:", data);
        document.getElementById("reportsTableBody").innerHTML =
          '<tr><td colspan="7" class="no-data">Error loading reports: ' +
          (data.message || "Unknown error") +
          "</td></tr>";
      }
    })
    .catch((error) => {
      console.error("Error loading reports:", error);
      document.getElementById("reportsTableBody").innerHTML =
        '<tr><td colspan="7" class="no-data">Error loading reports. Please refresh the page.</td></tr>';
    });
}

// Escape HTML to prevent XSS and template injection
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

// Event delegation for action buttons
setupReportButtonListeners = function () {
  const reportsTableBody = document.getElementById("reportsTableBody");
  if (!reportsTableBody) {
    console.warn("Reports table body not found, will retry...");
    setTimeout(setupReportButtonListeners, 500);
    return;
  }

  // Remove any existing listeners by cloning
  const newBody = reportsTableBody.cloneNode(true);
  reportsTableBody.parentNode.replaceChild(newBody, reportsTableBody);

  // Add fresh event listener
  document
    .getElementById("reportsTableBody")
    .addEventListener("click", function (event) {
      event.stopPropagation();

      // Find the button that was clicked (could be the button itself or an icon inside)
      let button = event.target;

      // If clicked on icon, get the parent button
      if (button.tagName === "I" || button.tagName === "i") {
        button = button.closest("button");
      }

      // If still not a button, try closest
      if (!button || button.tagName !== "BUTTON") {
        button = event.target.closest("button");
      }

      if (!button) {
        return;
      }

      // Check button classes
      const isViewBtn = button.classList.contains("view-btn");
      const isEditBtn = button.classList.contains("edit-btn");

      if (isViewBtn) {
        let reportId = button.getAttribute("data-report-id");

        // Fallback: try to get from onclick if data attribute is missing
        if (
          !reportId ||
          reportId === "" ||
          reportId === "null" ||
          reportId === "undefined"
        ) {
          const onclickAttr = button.getAttribute("onclick");
          if (onclickAttr) {
            const match = onclickAttr.match(/viewReportDetails\((\d+)\)/);
            if (match && match[1]) {
              reportId = match[1];
            }
          }
        }

        if (
          reportId &&
          reportId !== "" &&
          reportId !== "null" &&
          reportId !== "undefined"
        ) {
          event.preventDefault();
          event.stopPropagation();
          console.log("View button clicked for report ID:", reportId);
          const id = parseInt(reportId);
          if (!isNaN(id) && id > 0) {
            if (typeof viewReportDetails === "function") {
              viewReportDetails(id);
            } else if (typeof window.viewReportDetails === "function") {
              window.viewReportDetails(id);
            } else {
              console.error("viewReportDetails function not defined");
              alert("Error: Function not available. Please refresh the page.");
            }
          } else {
            console.error("Invalid report ID:", reportId, "parsed as:", id);
            alert("Invalid report ID. Please refresh the page.");
          }
        } else {
          console.error(
            "No valid data-report-id found on view button",
            button,
            "reportId:",
            reportId
          );
          alert("Error: Report ID not found. Please refresh the page.");
        }
      } else if (isEditBtn) {
        let reportId = button.getAttribute("data-report-id");

        // Fallback: try to get from onclick if data attribute is missing
        if (
          !reportId ||
          reportId === "" ||
          reportId === "null" ||
          reportId === "undefined"
        ) {
          const onclickAttr = button.getAttribute("onclick");
          if (onclickAttr) {
            const match = onclickAttr.match(/openReportActionModal\((\d+)\)/);
            if (match && match[1]) {
              reportId = match[1];
            }
          }
        }

        if (
          reportId &&
          reportId !== "" &&
          reportId !== "null" &&
          reportId !== "undefined"
        ) {
          event.preventDefault();
          event.stopPropagation();
          console.log("Edit button clicked for report ID:", reportId);
          const id = parseInt(reportId);
          if (!isNaN(id) && id > 0) {
            if (typeof openReportActionModal === "function") {
              openReportActionModal(id);
            } else if (typeof window.openReportActionModal === "function") {
              window.openReportActionModal(id);
            } else {
              console.error("openReportActionModal function not defined");
              alert("Error: Function not available. Please refresh the page.");
            }
          } else {
            console.error("Invalid report ID:", reportId, "parsed as:", id);
            alert("Invalid report ID. Please refresh the page.");
          }
        } else {
          console.error(
            "No valid data-report-id found on edit button",
            button,
            "reportId:",
            reportId
          );
          alert("Error: Report ID not found. Please refresh the page.");
        }
      }
    });
};

// Display reports in table
function displayReports(reports) {
  const tbody = document.getElementById("reportsTableBody");

  if (!reports || reports.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="no-data">No reports found</td></tr>';
    return;
  }

  // Store reports for later use
  window.currentReports = reports;

  tbody.innerHTML = reports
    .map((report) => {
      // Ensure report.id is valid
      if (!report || !report.id) {
        console.error("Invalid report object:", report);
        return ""; // Skip invalid reports
      }

      const statusClass = getStatusClass(report.status);
      const date = new Date(report.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Safely get reporter name, cleaning any template strings
      let reporterName = String(report.reporter_name || "");
      if (
        reporterName.includes("{{") ||
        reporterName.includes("{%") ||
        reporterName.trim() === ""
      ) {
        reporterName = "";
      }
      if (!reporterName && report.reporter_full_name) {
        reporterName = String(report.reporter_full_name || "").trim();
      }
      if (
        !reporterName &&
        (report.reporter_first_name || report.reporter_last_name)
      ) {
        reporterName = `${report.reporter_first_name || ""} ${
          report.reporter_last_name || ""
        }`.trim();
      }
      if (!reporterName) {
        reporterName = report.reporter_email || "Unknown";
      }

      // Safely get seller name, cleaning any template strings
      let sellerName = String(report.reported_seller_name || "");
      if (
        sellerName.includes("{{") ||
        sellerName.includes("{%") ||
        sellerName.trim() === ""
      ) {
        sellerName = "";
      }
      if (!sellerName && report.seller_full_name) {
        sellerName = String(report.seller_full_name || "").trim();
      }
      if (
        !sellerName &&
        (report.seller_first_name || report.seller_last_name)
      ) {
        sellerName = `${report.seller_first_name || ""} ${
          report.seller_last_name || ""
        }`.trim();
      }
      if (!sellerName) {
        sellerName = report.reported_seller_email || "Unknown";
      }

      return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-info">
              <div class="user-name">${escapeHtml(reporterName)}</div>
              <div class="user-id">${escapeHtml(
                report.reporter_email || "N/A"
              )}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="user-cell">
            <div class="user-info">
              <div class="user-name">${escapeHtml(sellerName)}</div>
              <div class="user-id">${escapeHtml(
                report.reported_seller_email || "N/A"
              )}</div>
            </div>
          </div>
        </td>
        <td><span class="reason-badge">${escapeHtml(
          report.report_reason || ""
        )}</span></td>
        <td>
          <div class="description-cell" title="${escapeHtml(
            report.report_description || ""
          )}">
            ${escapeHtml(truncateText(report.report_description || "", 50))}
          </div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${escapeHtml(
        report.status || ""
      )}</span>
        </td>
        <td>${date}</td>
        <td>
          <div class="action-buttons">
            <button
              class="action-btn view-btn"
              data-report-id="${report.id ? parseInt(report.id) : 0}"
              title="View Details"
              type="button"
            >
              <i class="fas fa-eye"></i>
            </button>
            ${
              report.status === "Pending" || report.status === "Reviewed"
                ? `
              <button
                class="action-btn edit-btn"
                data-report-id="${report.id ? parseInt(report.id) : 0}"
                title="Take Action"
                type="button"
              >
                <i class="fas fa-cog"></i>
              </button>
            `
                : ""
            }
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  // Re-setup event listeners after table is updated
  setTimeout(setupReportButtonListeners, 100);
}

// Get status badge class
function getStatusClass(status) {
  const statusMap = {
    Pending: "pending",
    Reviewed: "reviewed",
    Resolved: "resolved",
    Dismissed: "dismissed",
  };
  return statusMap[status] || "pending";
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Filter reports
function filterReports(status) {
  loadReports(status);
}

// Update filter button states
function updateFilterButtons(activeStatus) {
  document.querySelectorAll(".filter-btn[data-status]").forEach((btn) => {
    if (btn.getAttribute("data-status") === activeStatus) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Refresh reports
function refreshReports() {
  loadReports(currentStatusFilter);
}

// View report details (opens a simple view modal)
function viewReportDetails(reportId) {
  if (!reportId || isNaN(reportId)) {
    alert("Invalid report ID");
    return;
  }

  console.log("Loading report details for ID:", reportId);

  // Fetch all reports and find the specific one
  fetch(`/api/reports`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Reports data received:", data);
      if (data.success && data.reports && Array.isArray(data.reports)) {
        // Find report by ID
        const report = data.reports.find((r) => {
          const rId = parseInt(r.id);
          const targetId = parseInt(reportId);
          return rId === targetId;
        });
        if (report) {
          console.log("Found report:", report);
          // Show details in a simple alert or create a view-only modal
          showReportDetails(report, false);

          // For now, open the action modal but in view mode
          const modal = document.getElementById("reportActionModal");
          if (modal) {
            // Hide the form for view-only
            const form = document.getElementById("reportActionForm");
            if (form) {
              form.style.display = "none";
            }
            modal.style.display = "flex";
            modal.classList.add("show");
          }
        } else {
          console.error(
            "Report not found. ID:",
            reportId,
            "Available IDs:",
            data.reports.map((r) => r.id)
          );
          alert("Report not found. Please refresh the page and try again.");
        }
      } else {
        console.error("API returned error:", data);
        alert(data.message || "Error loading report details");
      }
    })
    .catch((error) => {
      console.error("Error fetching report for ID:", reportId, error);
      const errorMsg =
        error && error.message
          ? error.message
          : String(error || "Unknown error");
      alert("Error loading report details: " + errorMsg);
    });
}

// Show report details in modal (can be used for view-only or in action modal)
function showReportDetails(report, showInActionModal = true) {
  const detailsDiv = document.getElementById("reportDetails");
  if (!detailsDiv) {
    console.error("Report details div not found");
    return;
  }

  // Safely get names, cleaning any template strings
  let reporterName = String(report.reporter_name || "");
  if (
    reporterName.includes("{{") ||
    reporterName.includes("{%") ||
    reporterName.trim() === ""
  ) {
    reporterName = "";
  }
  if (!reporterName && report.reporter_full_name) {
    reporterName = String(report.reporter_full_name || "").trim();
  }
  if (
    !reporterName &&
    (report.reporter_first_name || report.reporter_last_name)
  ) {
    reporterName = `${report.reporter_first_name || ""} ${
      report.reporter_last_name || ""
    }`.trim();
  }
  if (!reporterName) {
    reporterName = report.reporter_email || "Unknown";
  }

  let sellerName = String(report.reported_seller_name || "");
  if (
    sellerName.includes("{{") ||
    sellerName.includes("{%") ||
    sellerName.trim() === ""
  ) {
    sellerName = "";
  }
  if (!sellerName && report.seller_full_name) {
    sellerName = String(report.seller_full_name || "").trim();
  }
  if (!sellerName && (report.seller_first_name || report.seller_last_name)) {
    sellerName = `${report.seller_first_name || ""} ${
      report.seller_last_name || ""
    }`.trim();
  }
  if (!sellerName) {
    sellerName = report.reported_seller_email || "Unknown";
  }

  detailsDiv.innerHTML = `
    <div style="background: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 15px 0; color: #1a202c;">Report Information</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div>
          <strong>Reporter:</strong>
          <p style="margin: 5px 0 0 0; color: #4a5568;">${escapeHtml(
            reporterName
          )}</p>
          <p style="margin: 2px 0 0 0; color: #718096; font-size: 0.85em;">${escapeHtml(
            report.reporter_email || "N/A"
          )}</p>
        </div>
        <div>
          <strong>Reported Seller:</strong>
          <p style="margin: 5px 0 0 0; color: #4a5568;">${escapeHtml(
            sellerName
          )}</p>
          <p style="margin: 2px 0 0 0; color: #718096; font-size: 0.85em;">${escapeHtml(
            report.reported_seller_email || "N/A"
          )}</p>
        </div>
        <div>
          <strong>Reason:</strong>
          <p style="margin: 5px 0 0 0; color: #4a5568;">${escapeHtml(
            report.report_reason || ""
          )}</p>
        </div>
        <div>
          <strong>Status:</strong>
          <p style="margin: 5px 0 0 0; color: #4a5568;"><span class="status-badge ${getStatusClass(
            report.status
          )}">${escapeHtml(report.status || "")}</span></p>
        </div>
      </div>
      <div style="margin-top: 15px;">
        <strong>Description:</strong>
        <p style="margin: 5px 0 0 0; color: #4a5568; line-height: 1.6;">${escapeHtml(
          report.report_description || ""
        )}</p>
      </div>
      ${
        report.admin_action
          ? `
        <div style="margin-top: 15px;">
          <strong>Admin Action:</strong>
          <p style="margin: 5px 0 0 0; color: #4a5568;">${escapeHtml(
            report.admin_action
          )}</p>
        </div>
      `
          : ""
      }
      ${
        report.admin_notes
          ? `
        <div style="margin-top: 15px;">
          <strong>Admin Notes:</strong>
          <p style="margin: 5px 0 0 0; color: #4a5568; line-height: 1.6;">${escapeHtml(
            report.admin_notes
          )}</p>
        </div>
      `
          : ""
      }
      <div style="margin-top: 15px; color: #718096; font-size: 14px;">
        <i class="fas fa-calendar"></i> Reported on: ${new Date(
          report.created_at
        ).toLocaleString()}
        ${
          report.reviewed_at
            ? `<br><i class="fas fa-check"></i> Reviewed on: ${new Date(
                report.reviewed_at
              ).toLocaleString()}`
            : ""
        }
      </div>
    </div>
  `;

  // Pre-fill form if already reviewed
  const actionSelect = document.getElementById("reportAction");
  const adminActionInput = document.getElementById("adminAction");
  const adminNotesInput = document.getElementById("adminNotes");
  const submitButton = document.querySelector(
    "#reportActionForm button[type='submit']"
  );

  if (report.status === "Resolved") {
    // Disable all form fields if status is Resolved
    if (actionSelect) {
      actionSelect.value = "resolve";
      actionSelect.disabled = true;
      actionSelect.style.opacity = "0.6";
      actionSelect.style.cursor = "not-allowed";
    }
    if (adminActionInput) {
      adminActionInput.value = report.admin_action || "";
      adminActionInput.disabled = true;
      adminActionInput.style.opacity = "0.6";
      adminActionInput.style.cursor = "not-allowed";
    }
    if (adminNotesInput) {
      adminNotesInput.value = report.admin_notes || "";
      adminNotesInput.disabled = true;
      adminNotesInput.style.opacity = "0.6";
      adminNotesInput.style.cursor = "not-allowed";
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.style.opacity = "0.6";
      submitButton.style.cursor = "not-allowed";
      submitButton.textContent = "Resolved - Cannot Edit";
    }
  } else if (report.status === "Reviewed") {
    // Allow editing if status is Reviewed
    if (actionSelect) {
      actionSelect.value = "review";
      actionSelect.disabled = false;
      actionSelect.style.opacity = "1";
      actionSelect.style.cursor = "pointer";
    }
    if (adminActionInput) {
      adminActionInput.value = report.admin_action || "";
      adminActionInput.disabled = false;
      adminActionInput.style.opacity = "1";
      adminActionInput.style.cursor = "text";
    }
    if (adminNotesInput) {
      adminNotesInput.value = report.admin_notes || "";
      adminNotesInput.disabled = false;
      adminNotesInput.style.opacity = "1";
      adminNotesInput.style.cursor = "text";
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.style.opacity = "1";
      submitButton.style.cursor = "pointer";
      submitButton.innerHTML = '<i class="fas fa-save"></i> Submit Action';
    }
  } else if (report.status === "Pending") {
    // Reset form for pending reports
    const form = document.getElementById("reportActionForm");
    if (form) {
      form.reset();
    }
    if (actionSelect) {
      actionSelect.disabled = false;
      actionSelect.style.opacity = "1";
      actionSelect.style.cursor = "pointer";
    }
    if (adminActionInput) {
      adminActionInput.disabled = false;
      adminActionInput.style.opacity = "1";
      adminActionInput.style.cursor = "text";
    }
    if (adminNotesInput) {
      adminNotesInput.disabled = false;
      adminNotesInput.style.opacity = "1";
      adminNotesInput.style.cursor = "text";
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.style.opacity = "1";
      submitButton.style.cursor = "pointer";
      submitButton.innerHTML = '<i class="fas fa-save"></i> Submit Action';
    }
  } else {
    // Dismissed or other status
    if (actionSelect) {
      actionSelect.value = report.status.toLowerCase().replace("d", "");
      actionSelect.disabled = true;
      actionSelect.style.opacity = "0.6";
    }
    if (adminActionInput) {
      adminActionInput.value = report.admin_action || "";
      adminActionInput.disabled = true;
      adminActionInput.style.opacity = "0.6";
    }
    if (adminNotesInput) {
      adminNotesInput.value = report.admin_notes || "";
      adminNotesInput.disabled = true;
      adminNotesInput.style.opacity = "0.6";
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.style.opacity = "0.6";
    }
  }

  // Set currentReportId from the report object
  if (report && report.id) {
    currentReportId = parseInt(report.id);
  }
}

// Open report action modal
function openReportActionModal(reportId) {
  if (!reportId) {
    alert("Invalid report ID");
    return;
  }

  console.log("Opening action modal for report ID:", reportId);
  currentReportId = reportId;

  // First, load the report details to show in the modal
  fetch(`/api/reports`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success && data.reports && Array.isArray(data.reports)) {
        const report = data.reports.find((r) => {
          const rId = parseInt(r.id);
          const targetId = parseInt(reportId);
          return rId === targetId;
        });

        if (report) {
          // Show report details in the modal
          showReportDetails(report, true);

          // Show the form for action
          const form = document.getElementById("reportActionForm");
          if (form) {
            form.style.display = "block";
          }

          // Open the modal
          const modal = document.getElementById("reportActionModal");
          if (modal) {
            modal.style.display = "flex";
            modal.classList.add("show");
          } else {
            console.error("Report action modal not found");
            alert("Error: Modal not found. Please refresh the page.");
          }
        } else {
          alert("Report not found. Please refresh the page and try again.");
        }
      } else {
        alert(data.message || "Error loading report details");
      }
    })
    .catch((error) => {
      console.error(
        "Error fetching report for modal, reportId:",
        reportId,
        error
      );
      const errorMsg =
        error && error.message
          ? error.message
          : String(error || "Unknown error");
      alert("Error loading report details: " + errorMsg);
    });
}

// Close report action modal
function closeReportActionModal() {
  const modal = document.getElementById("reportActionModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("show");
  }
  const form = document.getElementById("reportActionForm");
  if (form) {
    form.reset();
    form.style.display = "block"; // Ensure form is visible for next time
  }
  currentReportId = null;
}

// Submit report action
function submitReportAction(event) {
  event.preventDefault();

  if (!currentReportId) {
    alert("No report selected");
    return;
  }

  const formData = new FormData(event.target);
  const actionData = {
    action: formData.get("action"),
    admin_action: formData.get("admin_action"),
    admin_notes: formData.get("admin_notes"),
  };

  fetch(`/api/reports/${currentReportId}/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(actionData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert(data.message);
        closeReportActionModal();
        loadReports(currentStatusFilter);
      } else {
        alert(data.message || "Error processing action");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    });
}

// Close modal when clicking outside
window.addEventListener("click", function (event) {
  const modal = document.getElementById("reportActionModal");
  if (event.target === modal) {
    closeReportActionModal();
  }
});

// Make functions globally accessible
window.viewReportDetails = viewReportDetails;
window.openReportActionModal = openReportActionModal;
window.closeReportActionModal = closeReportActionModal;
window.submitReportAction = submitReportAction;
window.filterReports = filterReports;
window.refreshReports = refreshReports;
window.loadReports = loadReports;
