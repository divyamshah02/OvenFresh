// Newsletter form validation
document.getElementById('newsletterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    if (email && email.includes('@')) {
      alert('Thank you for subscribing!');
      this.reset();
    } else {
      alert('Please enter a valid email address.');
    }
  });