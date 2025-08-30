let csrf_token = null
let order_id = null
let order_detail_url = null
let delivery_persons_url = null
let update_order_status_url = null
let assign_delivery_person_url = null

// Data storage
let orderData = null
let deliveryPersons = []
let selectedDeliveryPerson = null
let selectedCommission = 0;

// Track if tax has been manually modified
let isTaxManuallyModified = false;

async function InitializeAdminOrderDetail(
  csrfTokenParam,
  orderIdParam,
  orderDetailUrlParam,
  deliveryPersonsUrlParam,
  updateOrderStatusUrlParam,
  assignDeliveryPersonUrlParam,
) {
  csrf_token = csrfTokenParam
  order_id = orderIdParam
  order_detail_url = orderDetailUrlParam
  delivery_persons_url = deliveryPersonsUrlParam
  update_order_status_url = updateOrderStatusUrlParam
  assign_delivery_person_url = assignDeliveryPersonUrlParam

  try {
    showLoading()

    // Load order details
    await loadOrderDetails()

    // Load delivery persons
    await loadDeliveryPersons()

    // Initialize event listeners
    initializeEventListeners()

    hideLoading()
  } catch (error) {
    console.error("Error initializing admin order detail:", error)
    showNotification("Error loading order details.", "error")
    hideLoading()
  }
}

async function loadOrderDetails() {
  try {
    console.log(`${order_detail_url}?order_id=${order_id}`)
    const [success, result] = await callApi("GET", `${order_detail_url}?order_id=${order_id}`)
    console.log("Order details loaded successfully:", result)
    if (success && result.success) {
      orderData = result.data
      populateOrderDetails()
    } else {
      throw new Error(result.error || "Failed to load order details")
    }
  } catch (error) {
    console.error("Error loading order details:", error)
    showNotification("Error loading order details.", "error")
  }
}

function populateOrderDetails() {
  if (!orderData) return

  // Update page title and breadcrumb
  document.getElementById("order-title").textContent = `Order #${orderData.order_id}`
  document.getElementById("breadcrumb-order-id").textContent = `Order #${orderData.order_id}`
  document.getElementById("order-date").textContent = `Placed on ${formatDate(orderData.created_at)}`

  // Update order status
  updateOrderStatusBadge(orderData.status)
  document.getElementById("status-select").value = orderData.status

  // Populate customer information
  populateCustomerInfo()

  // Populate payment information
  populatePaymentInfo()

  // Populate delivery information
  populateDeliveryInfo()

  // Populate delivery photos
  populateDeliveryPhotos()

  // Populate order summary
  populateOrderSummary()

  // Populate order items
  populateOrderItems()

  // Populate order timeline
  populateOrderTimeline()

  // Populate special instructions
  populateSpecialInstructions()
}

function populateCustomerInfo() {
  const customerInfo = document.getElementById("customer-info")
  customerInfo.innerHTML = `
        <p class="mb-1"><strong>${orderData.first_name} ${orderData.last_name}</strong></p>
        <p class="mb-1"><i class="fas fa-envelope me-2"></i>${orderData.email}</p>
        <p class="mb-0"><i class="fas fa-phone me-2"></i>${orderData.phone}</p>
    `
}

function populatePaymentInfo() {
  const paymentInfo = document.getElementById("payment-info")
  const paymentStatus = orderData.payment_received ? "Paid" : "Pending"
  const paymentClass = orderData.payment_received ? "success" : "warning"
  const isCorporate = orderData.is_corporate || false;
  // console.log("Is Corporate Order:", isCorporate);

  paymentInfo.innerHTML = `
        <p class="mb-1"><strong>Method:</strong> ${orderData.payment_method.toUpperCase()}</p>
        <p class="mb-1"><strong>Status:</strong> <span class="badge bg-${paymentClass}">${paymentStatus}</span></p>
        <p class="mb-0"><strong>Amount:</strong> ₹${Number.parseFloat(orderData.total_amount).toFixed(2)}</p>
        ${orderData.payment_id ? `<p class="mb-0"><small>ID: ${orderData.payment_id}</small></p>` : ""}
        ${orderData.different_billing_address ? `<p class="mb-0 mt-1"><strong>Blling Info:</strong></p>
        <small>${orderData.billing_first_name} ${orderData.billing_last_name}</small><br>
        <small>+91 ${orderData.billing_phone}</small><br>
        <small>${orderData.billing_address}, ${orderData.billing_city}, ${orderData.billing_pincode}</small><br>` : ""}
        <div class="form-check form-switch mt-3">
          <input class="form-check-input" type="checkbox" id="corporateOrderToggle" ${isCorporate ? 'checked' : ''}>
          <label class="form-check-label" for="corporateOrderToggle">Corporate Order</label>
        </div>
        <div id="corporate-order-actions" class="mt-2" style="display: ${isCorporate ? 'block' : 'none'}">
          <button class="btn btn-sm btn-outline-primary" id="updatePricingsBtn">
            <i class="fas fa-edit me-1"></i> Update Pricings
          </button>
        </div>       
    `;

  // Add event listener for the toggle
  document.getElementById('corporateOrderToggle').addEventListener('change', function() {
    const isChecked = this.checked;
    const actionsDiv = document.getElementById('corporate-order-actions');
    
    if (isChecked) {
      actionsDiv.style.display = 'block';
      // Update order status to corporate
      updateCorporateStatus(true);
    } else {
      actionsDiv.style.display = 'none';
      // Update order status to non-corporate
      updateCorporateStatus(false);
    }
  });

  // Add event listener for the update pricings button
  document.getElementById('updatePricingsBtn').addEventListener('click', function() {
    showCorporateOrderModal();
  });
}

async function updateCorporateStatus(isCorporate) {
  try {
    showLoading();
    
    const requestData = {
      order_id: orderData.order_id,
      is_corporate: isCorporate
    };
    
    // Call API to update the corporate status
    const [success, result] = await callApi(
      "POST", 
      "/order-api/admin-update-corporate-status/", 
      requestData,
      csrf_token
    );
    
    if (success && result.success) {
      orderData.is_corporate = isCorporate;
      showNotification(`Order marked as ${isCorporate ? 'corporate' : 'non-corporate'} successfully!`, 'success');
    } else {
      throw new Error(result.error || "Failed to update corporate status");
    }
  } catch (error) {
    console.error("Error updating corporate status:", error);
    showNotification('Error updating corporate status: ' + error.message, 'error');
    // Revert the toggle if the API call fails
    document.getElementById('corporateOrderToggle').checked = !isCorporate;
  } finally {
    hideLoading();
  }
}

function showCorporateOrderModal() {
  // Reset the manual modification flag
  isTaxManuallyModified = false;
  
  // Populate the modal with order items
  populateCorporateOrderItems();

  // Set original pricing values
  document.getElementById('original-subtotal').textContent = `₹${orderData.subtotal.toFixed(2)}`;
  document.getElementById('original-tax').textContent = `₹${orderData.tax_amount.toFixed(2)}`;
  document.getElementById('original-total').textContent = `₹${orderData.total_amount.toFixed(2)}`;
  
  // Set corporate pricing inputs
  document.getElementById('corporate-subtotal-input').value = orderData.subtotal.toFixed(2);
  document.getElementById('corporate-tax-input').value = (orderData.subtotal * 0.18).toFixed(2);
  
  // Calculate and display initial corporate total
  updateCorporateTotalPreview();
  
  // Add event listeners for input changes
  document.getElementById('corporate-subtotal-input').addEventListener('input', handleSubtotalChange);
  document.getElementById('corporate-tax-input').addEventListener('input', handleTaxInput);
  document.getElementById('reset-tax-btn').addEventListener('click', resetTaxToDefault);

  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById('corporateOrderModal'));
  modal.show();
}

function handleSubtotalChange() {
  const subtotalInput = document.getElementById('corporate-subtotal-input');
  const newSubtotal = parseFloat(subtotalInput.value) || 0;
  
  // Only auto-update tax if it hasn't been manually modified
  if (!isTaxManuallyModified) {
    const calculatedTax = newSubtotal * 0.18;
    document.getElementById('corporate-tax-input').value = calculatedTax.toFixed(2);
  }
  
  updateCorporateTotalPreview();
}

function handleTaxInput() {
  // Mark tax as manually modified when user changes it
  isTaxManuallyModified = true;
  updateCorporateTotalPreview();
}

function resetTaxToDefault() {
  const subtotalInput = document.getElementById('corporate-subtotal-input');
  const newSubtotal = parseFloat(subtotalInput.value) || 0;
  
  // Reset tax to 18% of subtotal
  const calculatedTax = newSubtotal * 0.18;
  document.getElementById('corporate-tax-input').value = calculatedTax.toFixed(2);
  
  // Reset the manual modification flag
  isTaxManuallyModified = false;
  
  updateCorporateTotalPreview();
}

function populateCorporateOrderItems() {
    const tbody = document.getElementById("corporate-order-items-tbody");
    tbody.innerHTML = orderData.order_items
        .map(
            (item, index) => `
            <tr data-item-index="${index}">
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.product_image}" alt="${item.product_name}" 
                             class="me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                        <div>
                            <strong>${item.product_name}</strong>
                            <br><small class="text-muted">ID: ${item.product_id}</small>
                        </div>
                    </div>
                </td>
                <td>${item.variation_name || "Standard"}</td>
                <td>${item.quantity}</td>
                <td>₹${Number.parseFloat(item.amount).toFixed(2)}</td>
                <td>₹${Number.parseFloat(item.discount).toFixed(2)}</td>
                <td>₹${Number.parseFloat(item.final_amount).toFixed(2)}</td>
            </tr>
        `,
        )
        .join("");
}

function updateCorporateTotalPreview() {
    const subtotalInput = document.getElementById('corporate-subtotal-input');
    const taxInput = document.getElementById('corporate-tax-input');
    
    const newSubtotal = parseFloat(subtotalInput.value) || 0;
    const newTax = parseFloat(taxInput.value) || 0;
    const newTotal = newSubtotal + newTax;
    
    document.getElementById('corporate-total-preview').textContent = `₹${newTotal.toFixed(2)}`;
}

async function saveCorporateOrderChanges() {
    try {
        showLoading();
        
        const newSubtotal = parseFloat(document.getElementById('corporate-subtotal-input').value) || 0;
        const newTax = parseFloat(document.getElementById('corporate-tax-input').value) || 0;
        const newTotal = newSubtotal + newTax;
        
        // Calculate the ratio for proportional adjustment
        const originalSubtotal = orderData.subtotal;
        const ratio = originalSubtotal > 0 ? newSubtotal / originalSubtotal : 1;
        
        // Prepare updated items with proportional price adjustments
        const updatedItems = orderData.order_items.map((item, index) => {
            const originalItemTotal = (item.amount * item.quantity) - item.discount;
            const newItemTotal = originalItemTotal * ratio;
            const newItemAmount = (newItemTotal + item.discount) / item.quantity;
            
            return {
                index: index,
                variation: item.variation_name,
                quantity: item.quantity,
                price: newItemAmount,
                discount: item.discount,
                notes: item.item_note || ""
            };
        });
        
        // Prepare data for API call
        const requestData = {
            order_id: orderData.order_id,
            is_corporate: true,
            items: updatedItems,
            subtotal: newSubtotal,
            tax_amount: newTax,
            total_amount: newTotal
        };
        
        // Call API to update the order
        const [success, result] = await callApi(
            "POST", 
            "/order-api/admin-update-corporate-order/", 
            requestData,
            csrf_token
        );
        
        if (success && result.success) {
            // Update the local order data with new values
            updatedItems.forEach(updatedItem => {
                const index = updatedItem.index;
                if (orderData.order_items[index]) {
                    orderData.order_items[index].amount = updatedItem.price;
                    orderData.order_items[index].final_amount = 
                        (updatedItem.price * updatedItem.quantity) - updatedItem.discount;
                }
            });
            
            orderData.subtotal = newSubtotal;
            orderData.tax_amount = newTax;
            orderData.total_amount = newTotal;
            orderData.is_corporate = true;
            
            // Update the UI
            populateOrderItems();
            populateOrderSummary();
            
            // Show success message
            showNotification('Corporate pricing updated successfully!', 'success');
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('corporateOrderModal'));
            modal.hide();
        } else {
            throw new Error(result.error || "Failed to update corporate order");
        }
    } catch (error) {
        console.error("Error saving corporate order changes:", error);
        showNotification('Error saving corporate order changes: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function populateDeliveryInfo_old() {
  const deliveryInfo = document.getElementById("delivery-info")
  deliveryInfo.innerHTML = `
        <p class="mb-1"><strong>Date:</strong> ${new Date(orderData.delivery_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p class="mb-1"><strong>Time:</strong> ${orderData.timeslot_name || "Not specified"}</p>
        <p class="mb-0"><strong>Address:</strong></p>
        <small>${orderData.delivery_address}</small>
        ${
          orderData.assigned_delivery_partner_name
            ? `<p class="mt-2 mb-0"><strong>Assigned to:</strong> ${orderData.assigned_delivery_partner_name}</p>
               <p class="mb-0"><strong>Commission:</strong> ${orderData.assigned_delivery_partner_commission || "0"}</p>`
            : '<p class="mt-2 mb-0 text-warning"><strong>No delivery person assigned</strong></p>'
        }
    `
}

function populateDeliveryInfo() {
  const deliveryInfo = document.getElementById("delivery-info");
  
  deliveryInfo.innerHTML = `
    <div id="delivery-display">
      <p class="mb-1"><strong>Date:</strong> ${new Date(orderData.delivery_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
      <p class="mb-1"><strong>Time:</strong> ${orderData.timeslot_name || "Not specified"}</p>
      <p class="mb-0"><strong>Address:</strong></p>
      <small>${orderData.delivery_address}</small>
      ${
        orderData.assigned_delivery_partner_name
          ? `<p class="mt-2 mb-0"><strong>Assigned to:</strong> ${orderData.assigned_delivery_partner_name}</p>
             <p class="mb-0"><strong>Commission:</strong> ${orderData.assigned_delivery_partner_commission || "0"}</p>`
          : '<p class="mt-2 mb-0 text-warning"><strong>No delivery person assigned</strong></p>'
      }
      <div class="mt-3">
        <button class="btn btn-sm btn-outline-primary" id="edit-delivery-btn">
          <i class="fas fa-edit me-1"></i> Edit Delivery
        </button>
      </div>
    </div>
    <div id="delivery-edit" style="display: none;">
      <div class="mb-2">
        <label for="delivery-date-input" class="form-label">Delivery Date</label>
        <input type="date" class="form-control" id="delivery-date-input" 
               min="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="mb-2">
        <label for="timeslot-select" class="form-label">Time Slot</label>
        <select class="form-select" id="timeslot-select">
          <option value="">Loading time slots...</option>
        </select>
      </div>
      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-sm btn-primary" id="save-delivery-btn">
          <i class="fas fa-save me-1"></i> Save
        </button>
        <button class="btn btn-sm btn-secondary" id="cancel-delivery-btn">
          <i class="fas fa-times me-1"></i> Cancel
        </button>
      </div>
    </div>
  `;

  // Set initial values
  document.getElementById('delivery-date-input').value = orderData.delivery_date;
  
  // Add event listeners
  document.getElementById('edit-delivery-btn').addEventListener('click', showDeliveryEditForm);
  document.getElementById('save-delivery-btn').addEventListener('click', saveDeliveryDetails);
  document.getElementById('cancel-delivery-btn').addEventListener('click', hideDeliveryEditForm);
  document.getElementById('delivery-date-input').addEventListener('change', loadTimeSlotsForDate);
  
  // Load time slots for the current date
  loadTimeSlotsForDate();
}

function showDeliveryEditForm() {
  document.getElementById('delivery-display').style.display = 'none';
  document.getElementById('delivery-edit').style.display = 'block';
}

function hideDeliveryEditForm() {
  document.getElementById('delivery-display').style.display = 'block';
  document.getElementById('delivery-edit').style.display = 'none';
}

async function loadTimeSlotsForDate() {
  const dateInput = document.getElementById('delivery-date-input');
  const timeslotSelect = document.getElementById('timeslot-select');
  
  if (!dateInput.value) return;
  
  try {
    timeslotSelect.innerHTML = '<option value="">Loading time slots...</option>';
    
    const [success, result] = await callApi(
      "GET", 
      `/order-api/active-timeslots/?date=${dateInput.value}`,
      null,
      csrf_token
    );
    
    if (success && result.success) {
      const timeSlots = result.data;
      
      timeslotSelect.innerHTML = '';
      if (timeSlots.length === 0) {
        timeslotSelect.innerHTML = '<option value="">No time slots available</option>';
        return;
      }
      
      // Add options for each time slot
      timeSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.id;
        option.textContent = `${slot.time_slot_title} (${slot.start_time} - ${slot.end_time})`;
        
        // Select the current time slot if it matches
        if (orderData.timeslot_id === slot.id) {
          option.selected = true;
        }
        
        timeslotSelect.appendChild(option);
      });
    } else {
      throw new Error(result.error || "Failed to load time slots");
    }
  } catch (error) {
    console.error("Error loading time slots:", error);
    timeslotSelect.innerHTML = '<option value="">Error loading time slots</option>';
    showNotification('Error loading time slots: ' + error.message, 'error');
  }
}

async function saveDeliveryDetails() {
  try {
    showLoading();
    
    const dateInput = document.getElementById('delivery-date-input');
    const timeslotSelect = document.getElementById('timeslot-select');
    
    const deliveryDate = dateInput.value;
    const timeslotId = timeslotSelect.value;
    
    if (!deliveryDate) {
      showNotification('Please select a delivery date', 'error');
      return;
    }
    
    if (!timeslotId) {
      showNotification('Please select a time slot', 'error');
      return;
    }
    
    // Check if the selected date is valid (not in the past)
    const selectedDate = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      showNotification('Delivery date cannot be in the past', 'error');
      return;
    }
    
    // Prepare data for API call
    const requestData = {
      order_id: orderData.order_id,
      delivery_date: deliveryDate,
      timeslot_id: timeslotId
    };
    
    // Call API to update the delivery details
    const [success, result] = await callApi(
      "POST", 
      "/order-api/admin-update-delivery-details/", 
      requestData,
      csrf_token
    );
    
    if (success && result.success) {
      // Update the local order data
      orderData.delivery_date = deliveryDate;
      orderData.timeslot_id = timeslotId;
      
      // Update the timeslot name from the selected option
      const selectedOption = timeslotSelect.options[timeslotSelect.selectedIndex];
      orderData.timeslot_name = selectedOption.textContent;
      
      // Update the UI
      populateDeliveryInfo();
      
      // Show success message
      showNotification('Delivery details updated successfully!', 'success');
    } else {
      throw new Error(result.error || "Failed to update delivery details");
    }
  } catch (error) {
    console.error("Error saving delivery details:", error);
    showNotification('Error saving delivery details: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

function populateOrderSummary() {
  const orderSummary = document.getElementById("order-summary")
  orderSummary.innerHTML = `
        <p class="mb-1"><strong>Subtotal:</strong> ₹${orderData.subtotal.toFixed(2)}</p>
        <p class="mb-1"><strong>Delivery:</strong> ₹${orderData.delivery_charge.toFixed(2)}</p>
        <p class="mb-1"><strong>Tax:</strong> ₹${orderData.tax_amount.toFixed(2)}</p>
        <hr class="my-2">
        <p class="mb-0"><strong>Total:</strong> ₹${Number.parseFloat(orderData.total_amount).toFixed(2)}</p>
    `
}

function populateOrderItems() {
  const tbody = document.getElementById("order-items-tbody")
  tbody.innerHTML = orderData.order_items
    .map(
      (item) => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.product_image}" alt="${item.product_name}" 
                         class="me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                    <div>
                        <strong>${item.product_name}</strong>
                    </div>
                </div>
            </td>
            <td>${item.variation_name || "Standard"}</td>
            <td><span class="badge bg-primary">${item.quantity}</span></td>
            <td>₹${Number.parseFloat(item.amount).toFixed(2)}</td>
            <td>₹${Number.parseFloat(item.discount).toFixed(2)}</td>
            <td><strong>₹${Number.parseFloat(item.final_amount).toFixed(2)}</strong></td>
            <td>${item.item_note || "-"}</td>
        </tr>
    `,
    )
    .join("")
}

function populateDeliveryPhotos() {
    // Get delivery photos container
    const container = document.getElementById("delivery-photos-container");
    
    // Clear existing content
    container.innerHTML = "";
    
    // Populate delivery photos if available
    if (orderData.delivery_photos && orderData.delivery_photos.length > 0) {
        orderData.delivery_photos.forEach((photoUrl, index) => {
            const photoElement = document.createElement("div");
            photoElement.className = "col-4 col-md-3";
            photoElement.innerHTML = `
                <a href="${photoUrl}" target="_blank">
                  <img src="${photoUrl}" 
                      alt="Delivery photo ${index + 1}" 
                      class="img-fluid rounded border delivery-photo">
            `;
            container.appendChild(photoElement);
        });
    } else {
        // Show placeholder if no photos
        container.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="text-muted">
                    <i class="fas fa-images fa-2x mb-2"></i>
                    <p>No delivery photos available</p>
                </div>
            </div>
        `;
    }
    
    // Populate total extra cost
    const extraCost = orderData.extra_cost || 0;
    document.getElementById("total-extra-cost").textContent = extraCost.toFixed(2);
    document.getElementById("mode-transport").textContent = orderData.transport_mode;
}

function populateOrderTimeline() {
  const timeline = document.getElementById("order-timeline")
  const statuses = [
    { key: "placed", label: "Order Placed", icon: "fas fa-shopping-cart" },
    { key: "preparing", label: "Preparing", icon: "fas fa-utensils" },
    { key: "ready", label: "Ready for Delivery", icon: "fas fa-box" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "fas fa-truck" },
    { key: "delivered", label: "Delivered", icon: "fas fa-home" },
  ]

  const currentStatusIndex = statuses.findIndex((s) => s.key === orderData.status)

  timeline.innerHTML = statuses
    .map((status, index) => {
      let itemClass = ""
      if (index < currentStatusIndex) itemClass = "active"
      else if (index === currentStatusIndex) itemClass = "current"

      return `
            <div class="timeline-item ${itemClass}">
                <div class="d-flex align-items-center">
                    <i class="${status.icon} me-2"></i>
                    <div>
                        <strong>${status.label}</strong>
                        ${index <= currentStatusIndex ? `<br><small class="text-muted">${formatDate(orderData.created_at)}</small>` : ""}
                    </div>
                </div>
            </div>
        `
    })
    .join("")
}

function populateSpecialInstructions() {
  const specialInstructions = document.getElementById("special-instructions")
  specialInstructions.innerHTML =
    orderData.special_instructions || '<p class="text-muted">No special instructions provided.</p>'
}

async function loadDeliveryPersons() {
  try {
    const [success, result] = await callApi("GET", delivery_persons_url)

    if (success && result.success) {
      deliveryPersons = result.data.delivery_persons || []
      renderDeliveryPersons()
    } else {
      throw new Error(result.error || "Failed to load delivery persons")
    }
  } catch (error) {
    console.error("Error loading delivery persons:", error)
    showNotification("Error loading delivery persons.", "error")
  }
}

function renderDeliveryPersons() {
  const container = document.getElementById("delivery-persons-container")

  if (deliveryPersons.length === 0) {
    container.innerHTML = '<p class="text-muted">No delivery persons available.</p>'
    return
  }

  container.innerHTML = deliveryPersons
    .map(
      (person) => `
        <div class="col-md-6 mb-3">
            <div class="delivery-person-card ${orderData.assigned_delivery_partner_id === person.user_id ? "selected" : ""}" 
                 data-person-id="${person.user_id}" onclick="selectDeliveryPerson('${person.user_id}')">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="fas fa-user-circle fa-2x text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${person.name}</h6>
                        <p class="mb-1 text-muted">${person.phone}</p>
                        <small class="badge ${person.is_available ? "bg-success" : "bg-warning"}">
                            ${person.is_available ? "Available" : "Busy"}
                        </small>
                    </div>
                    <div>
                        <i class="fas fa-motorcycle text-muted"></i>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join("")

  // Set initially selected delivery person
  if (orderData.assigned_delivery_partner_id) {
    selectedDeliveryPerson = orderData.assigned_delivery_partner_id
  }
}

function selectDeliveryPerson(personId) {
  // Remove previous selection
  document.querySelectorAll(".delivery-person-card").forEach((card) => {
    card.classList.remove("selected")
  })

  // Add selection to clicked card
  document.querySelector(`[data-person-id="${personId}"]`).classList.add("selected")
  selectedDeliveryPerson = personId
}

function openCommissionModal() {
  // Ensure a delivery person is selected before showing modal
  if (!selectedDeliveryPerson) {
    showNotification("Please select a delivery person.", "warning");
    return;
  }

  // Reset commission input before showing
  document.getElementById("commissionInput").value = "";

  // Show Bootstrap modal
  const commissionModal = new bootstrap.Modal(document.getElementById("commissionModal"));
  commissionModal.show();
}

async function assignDeliveryPerson() {
  selectedCommission = parseFloat(document.getElementById("commissionInput").value);

  if (isNaN(selectedCommission)) {
      showNotification("Invalid Commission Amount!", "warning");
      return;
  }

  if (selectedCommission < 0) {
    showNotification("Commission cannot be negative.", "warning");
    return;
  }
  selectedCommission = parseFloat(selectedCommission.toFixed(2));

  try {
    showLoading()

    const [success, result] = await callApi(
      "POST",
      assign_delivery_person_url,
      {
        order_id: order_id,
        delivery_person_id: selectedDeliveryPerson,
        commission: selectedCommission,
      },
      csrf_token,
    )

    if (success && result.success) {
      showNotification("Delivery person assigned successfully!", "success")
      await loadOrderDetails() // Refresh order details
      bootstrap.Modal.getInstance(document.getElementById("commissionModal")).hide();
    } else {
      throw new Error(result.error || "Failed to assign delivery person")
    }
  } catch (error) {
    console.error("Error assigning delivery person:", error)
    showNotification("Error assigning delivery person.", "error")
  } finally {
    hideLoading()
  }
}

function updateOrderStatus(no_modal=false) {
  const newStatus = document.getElementById("status-select").value
  document.getElementById("modal-status-select").value = newStatus

  if (!no_modal) {
    const modal = new bootstrap.Modal(document.getElementById("updateStatusModal"))
    modal.show()
  }
  else {
    document.getElementById('new_update_btn').style.display = 'none';
  }
}

async function confirmStatusUpdate() {
  const newStatus = document.getElementById("modal-status-select").value
  const notes = document.getElementById("status-notes").value

  try {
    showLoading()

    const [success, result] = await callApi(
      "POST",
      update_order_status_url,
      {
        order_id: order_id,
        status: newStatus,
        notes: notes,
      },
      csrf_token,
    )

    if (success && result.success) {
      showNotification("Order status updated successfully!", "success")

      // Close modal
      try{
        bootstrap.Modal.getInstance(document.getElementById("updateStatusModal")).hide()
      }
      catch {
        
      }

      // Refresh order details
      await loadOrderDetails()
    } else {
      throw new Error(result.error || "Failed to update order status")
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    showNotification("Error updating order status.", "error")
  } finally {
    hideLoading()
  }
}

function updateOrderStatusBadge(status, is_new=false) {
  const badge = document.getElementById("order-status-badge")
  const statusConfig = {
    placed: { class: "bg-info", text: "Placed" },
    confirmed: { class: "bg-primary", text: "Confirmed" },
    preparing: { class: "bg-warning", text: "Preparing" },
    ready: { class: "bg-info", text: "Ready" },
    out_for_delivery: { class: "bg-primary", text: "Out for Delivery" },
    delivered: { class: "bg-success", text: "Delivered" },
    cancelled: { class: "bg-danger", text: "Cancelled" },
  }

  const config = statusConfig[status] || { class: "bg-secondary", text: status }
  badge.className = `order-status-badge badge ${config.class}`
  badge.textContent = config.text

  if (is_new) {
    updateOrderStatus(true)
    document.getElementById('new_update_btn').style.display = '';
  }
}

function downloadKOT() {
  // Populate KOT data
  populateKOTData()

  // Generate PDF
  generateKOTPDF()
}

function printKOT() {
  // Populate KOT data
  populateKOTData()

  // Print the KOT section
  window.print()
}

function populateKOTData() {
  // Populate KOT header
  document.getElementById("kot-order-id").textContent = orderData.order_id
  document.getElementById("kot-date").textContent = formatDate(orderData.created_at)

  // Populate customer details
  // document.getElementById("kot-customer-details").innerHTML = `
  //       <p><strong>${orderData.first_name} ${orderData.last_name}</strong></p>
  //       <p>${orderData.phone}</p>
  //       <p>${orderData.email}</p>
  //   `

  // Populate delivery details
  document.getElementById("kot-delivery-details").innerHTML = `
        <p><strong>Date:</strong> ${new Date(orderData.delivery_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p><strong>Time:</strong> ${orderData.timeslot_name || "Not specified"}</p>
        <p><strong>Address:</strong> ${orderData.delivery_address}</p>
    `

  // Populate KOT items
  const kotItemsTbody = document.getElementById("kot-items-tbody")
  kotItemsTbody.innerHTML = orderData.order_items
    .map(
      (item) => `
        <tr>
            <td><strong>${item.product_name}</strong></td>
            <td>${item.variation_name || "Standard"}</td>
            <td class="text-center"><strong>${item.quantity}</strong></td>
            <td>${item.item_note || "-"}</td>
        </tr>
    `,
    )
    .join("")

  // Populate special instructions
  document.getElementById("kot-special-instructions").innerHTML = orderData.special_instructions || "None"

  // Populate kitchen notes (admin notes)
  document.getElementById("kot-kitchen-notes").innerHTML = document.getElementById("admin-notes").value || "None"
}

function generateKOTPDF_old() {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  // Add content to PDF
  doc.setFontSize(20)
  doc.text("KITCHEN ORDER TICKET (KOT)", 20, 20)

  doc.setFontSize(14)
  doc.text("Order Details", 20, 35)

  doc.setFontSize(12)
  doc.text(`Order ID: ${orderData.order_id}`, 20, 42)
  doc.text(`Date: ${formatDate(orderData.created_at)}`, 20, 49)

  // Customer details
  // doc.text("Customer Details:", 20, 70)
  // doc.text(`Name: ${orderData.first_name} ${orderData.last_name}`, 20, 85)
  // doc.text(`Phone: ${orderData.phone}`, 20, 95)

  // Delivery details
  doc.setFontSize(14)
  doc.text("Delivery Details:", 20, 64)
  doc.setFontSize(12)
  doc.text(`Date: ${new Date(orderData.delivery_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, 20, 71)
  doc.text(`Time: ${orderData.timeslot_name || "Not specified"}`, 20, 78)

  // Order items
  doc.setFontSize(14)
  doc.text("Order Items:", 20, 93)
  doc.setFontSize(12)

  let yPosition = 100

  orderData.order_items.forEach((item) => {
    doc.text(`${item.quantity}x ${item.product_name}`, 20, yPosition)
    if (item.variation_name && item.variation_name !== "Standard") {
      doc.text(`(${item.variation_name})`, 120, yPosition)
    }
    yPosition += 7
  })

  // Special instructions
  if (orderData.special_instructions) {
    yPosition += 10
    doc.text("Special Instructions:", 20, yPosition)
    yPosition += 10
    doc.text(orderData.special_instructions, 20, yPosition)
  }

  // Save the PDF
  doc.save(`KOT-${orderData.order_id}.pdf`)
}

function generateKOTPDF() {
  const { jsPDF } = window.jspdf

  // Page size for 75mm thermal printer
  const pageWidth = 75 // mm
  const pageHeight = 200 // mm

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pageWidth, pageHeight]
  })

  // Title
  doc.setFontSize(14)
  doc.text("KOT", 5, 10)

  doc.setFontSize(12)
  doc.text("Order Details", 5, 18)

  // Start Y position
  let y = 24
  doc.setFontSize(10)

  // Order metadata
  doc.text(`Order Number: #${orderData.order_number}`, 5, y)
  y += 6
  doc.text(`Order ID: ${orderData.order_id}`, 5, y)
  y += 6
  doc.text(`Date: ${formatDate(orderData.created_at)}`, 5, y)
  y += 10

  // Delivery details
  doc.setFontSize(12)
  doc.text("Delivery Details:", 5, y)
  y += 6
  doc.setFontSize(10)
  doc.text(
    `Date: ${new Date(orderData.delivery_date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })}`,
    5,
    y
  )
  y += 6
  doc.text(`Time: ${orderData.timeslot_name || "Not specified"}`, 5, y)
  y += 10

  // Order items
  doc.setFontSize(12)
  doc.text("Order Items:", 5, y)
  y += 6
  doc.setFontSize(10)

  orderData.order_items.forEach((item) => {
    doc.text(`${item.quantity}x ${item.product_name}`, 5, y)
    y += 5
    if (item.variation_name && item.variation_name !== "Standard") {
      doc.text(`(${item.variation_name})`, 5, y)
      y += 5
    }
    y += 5 // space after each item
  })

  // Special instructions
  if (orderData.special_instructions) {
    y += 4
    doc.setFontSize(12)
    doc.text("Special Instructions:", 5, y)
    y += 6
    doc.setFontSize(10)
    doc.text(orderData.special_instructions, 5, y)
  }

  // Save the PDF
  doc.save(`KOT-${orderData.order_id}.pdf`)
}


function initializeEventListeners() {
  // Status select change
  document.getElementById("status-select").addEventListener("change", function () {
    updateOrderStatusBadge(this.value, true)
  })

  // Admin notes save button
  document.getElementById("saveNotesBtn").addEventListener("click", () => {
    // You can implement save functionality here
    showNotification("Notes saved successfully!", "success")
  })

  // Refresh delivery persons button
  document.getElementById("refreshDeliveryBtn").addEventListener("click", async () => {
    await loadDeliveryPersons()
    showNotification("Delivery persons list refreshed", "info")
  })
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function showLoading() {
  const loader = document.getElementById("loader")
  if (loader) loader.style.display = "flex"
}

function hideLoading() {
  const loader = document.getElementById("loader")
  if (loader) loader.style.display = "none"
}

function showNotification(message, type = "info") {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toastContainer")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.id = "toastContainer"
    toastContainer.className = "position-fixed bottom-0 end-0 p-3"
    toastContainer.style.zIndex = "9999"
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toastId = `toast-${Date.now()}`
  const toast = document.createElement("div")
  toast.className = `toast show border-0`
  toast.id = toastId

  // Set toast background color based on type
  const bgClass =
    type === "error" ? "bg-danger" : type === "success" ? "bg-success" : type === "warning" ? "bg-warning" : "bg-info"

  toast.classList.add(bgClass, "text-white")

  toast.innerHTML = `
    <div class="toast-header bg-transparent text-white border-0">
      <strong class="me-auto">
        <i class="fas ${
          type === "error"
            ? "fa-exclamation-circle"
            : type === "success"
              ? "fa-check-circle"
              : type === "warning"
                ? "fa-exclamation-triangle"
                : "fa-info-circle"
        } me-2"></i>
        Notification
      </strong>
      <small>Just now</small>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `

  // Add toast to container
  toastContainer.appendChild(toast)

  // Initialize Bootstrap toast
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 5000,
  })

  // Show toast
  bsToast.show()

  // Remove toast after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove()
  })
}
