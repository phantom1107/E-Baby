let currentUserId = null;

        function toggleCustomReason(select) {
            const customReason = document.getElementById("customReason");
            if (select.value === "Others") {
                customReason.style.display = "block";
            } else {
                customReason.style.display = "none";
            }
        }

        function showRejectionModal(button) {
            // Support both legacy data-user-id and new data-target ids (e.g., s12, r5)
            const idAttr = button.getAttribute("data-user-id") || button.getAttribute("data-target");
            currentUserId = idAttr;
            document.getElementById("rejectionModal").style.display = "flex";
            document.getElementById("reasonSelect").value = ""; // Reset dropdown
            document.getElementById("customReason").style.display = "none"; // Hide custom reason textarea
            document.getElementById("customReason").value = ""; // Clear custom reason text
        }

        function closeRejectionModal() {
            document.getElementById("rejectionModal").style.display = "none";
            document.getElementById("reasonSelect").value = ""; // Reset dropdown
            document.getElementById("customReason").style.display = "none"; // Hide custom reason textarea
            document.getElementById("customReason").value = ""; // Clear custom reason text
        }

        function submitRejection() {
            const selectedReason = document.getElementById("reasonSelect").value;
            const customReason = document.getElementById("customReason").value;

            let finalReason = selectedReason;
            if (selectedReason === "Others") {
                if (!customReason.trim()) {
                    alert("Please provide a custom reason.");
                    return;
                }
                finalReason = customReason;
            }

            if (!finalReason) {
                alert("Please select or provide a reason for rejection.");
                return;
            }

            // Submit the correct form and set its hidden input based on currentUserId
            const form = document.getElementById(`reject-form-${currentUserId}`);
            const input = document.getElementById(`reason-input-${currentUserId}`);
            if (!form || !input) {
                alert('Unable to submit rejection. Form not found.');
                return;
            }
            input.value = finalReason;
            form.submit();
            closeRejectionModal();
        }


        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const dashboard = document.querySelector('.dashboard');
            sidebar.classList.toggle('collapsed');
            dashboard.classList.toggle('expanded');

            const icon = document.querySelector('.sidebar-toggle i');
            if (sidebar.classList.contains('collapsed')) {
                icon.style.transform = 'rotate(180deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        }