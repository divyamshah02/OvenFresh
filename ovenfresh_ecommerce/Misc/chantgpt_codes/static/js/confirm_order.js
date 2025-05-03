let csrf_token = null;
let confirm_order_api_url = null;

async function ConfirmOrder(csrf_token_param, confirm_order_api_url_param) {
  csrf_token = csrf_token_param;
  confirm_order_api_url = confirm_order_api_url_param;

  const urlParams = new URLSearchParams(window.location.search);
  const order_id = urlParams.get("order_id");
  const payment_id = urlParams.get("payment_id");

  if (!order_id || !payment_id) {
    alert("Missing order or payment details.");
    return;
  }

  const payload = {
    order_id: order_id,
    payment_id: payment_id
  };

  const [success, result] = await callApi("POST", confirm_order_api_url, payload, csrf_token);

  if (!success || !result.success) {
    alert("Failed to confirm your order. Please contact support.");
    return;
  }

  // Redirect to order detail page
  window.location.href = `/order/${order_id}/detail/`;
}



// Usage in HTML

// <script>
//   window.onload = async function () {
//     await ConfirmOrder(
//       "{{ csrf_token }}",
//       "{% url 'confirm-order-api' %}"
//     );
//   };
// </script>
