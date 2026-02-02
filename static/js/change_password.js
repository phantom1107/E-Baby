function confirmPasswordChange() {
    if (confirm("Are you sure you want to change your password?")) {
        // Perform basic client-side check
        const newPassword = document.getElementById("new_password").value;
        const confirmPassword = document.getElementById("confirm_password").value;
        if (newPassword !== confirmPassword) {
            alert("New password and confirm password do not match. Please try again.");
            return; 
        }
        // Submit the form if all checks pass
        document.getElementById("changePasswordForm").submit();
    }
}