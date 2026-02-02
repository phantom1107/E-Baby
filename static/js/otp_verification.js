document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.otp-input');
    const form = document.querySelector('form');
    const finalOtpInput = document.getElementById('finalOtp');
    const otpContainer = document.getElementById('otpContainer');
    const flashOk = document.getElementById('flashOk');
    const flashModal = document.getElementById('flashModal');

    // Handle paste event on the container AND on each input
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        if (!/^\d+$/.test(pastedData)) return;
        
        const digits = pastedData.split('').slice(0, inputs.length);
        digits.forEach((digit, i) => {
            if (i < inputs.length) {
                inputs[i].value = digit;
            }
        });

        const nextEmptyIndex = digits.length < inputs.length ? digits.length : inputs.length - 1;
        inputs[nextEmptyIndex].focus();
    };

    otpContainer.addEventListener('paste', handlePaste);
    inputs.forEach(input => {
        input.addEventListener('paste', handlePaste);
    });

    inputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (this.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value) {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });

        input.addEventListener('keypress', function(e) {
            if (e.keyCode < 48 || e.keyCode > 57) {
                e.preventDefault();
            }
        });
    });
    if (flashOk && flashModal) {
        flashOk.addEventListener('click', function(){
            flashModal.style.display = 'none';
        });
    }
});

function handleFormSubmit(event) {
    event.preventDefault();
    const inputs = document.querySelectorAll('.otp-input');
    const finalOtpInput = document.getElementById('finalOtp');
    
    const otp = Array.from(inputs).map(input => input.value).join('');
    finalOtpInput.value = otp;

    fetch('/otp_verification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: otp })
    })
    .then(response => response.json())
    .then(data => {
            if (data.success) {
            const infoModal = document.getElementById('infoModal');
            const infoMessage = document.getElementById('infoMessage');
            const infoOk = document.getElementById('infoOk');
            if (data.message && data.message.includes('pending')) {
                infoMessage.textContent = 'Thank you for registering! Please check your email for updates from the admin about your application status.';
            } else {
                infoMessage.textContent = 'Registration successful! Please check your email for a confirmation and welcome message.';
            }
            if (infoModal && infoOk) {
                infoModal.style.display = 'block';
                infoOk.onclick = function(){ window.location.href = '/'; };
            } else {
                window.location.href = '/';
            }
        } else {
            alert(data.error || 'Invalid verification code. Please try again.');
            inputs.forEach(input => input.value = '');
            inputs[0].focus();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
}