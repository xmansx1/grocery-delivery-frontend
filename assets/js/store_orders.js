// 📁 store_orders.js - سكربت إدارة الطلبات في واجهة المتجر

const token = localStorage.getItem("store_token");
if (!token) {
  window.location.href = "/store/login.html";
}

let selectedOrderId = null;

document.addEventListener("DOMContentLoaded", () => {
  fetchStoreOrders();
  setInterval(fetchStoreOrders, 10000); // تحديث كل 10 ثواني
});

async function fetchStoreOrders() {
  try {
    const res = await fetch(`${API_BASE_URL}/store/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const orders = data.filter(o => !["تم التوصيل", "تم الإلغاء"].includes(o.status));
    renderOrders(orders);
  } catch (err) {
    document.getElementById("ordersContainer").innerHTML =
      `<div class='alert alert-danger'>فشل تحميل الطلبات</div>`;
  }
}

function renderOrders(orders) {
  const container = document.getElementById("ordersContainer");
  container.innerHTML = "";
  orders.forEach(order => {
    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <div class="d-flex justify-content-between">
        <h5>العميل: ${order.customer_name}</h5>
        <span class="badge-status" style="background-color: ${getStatusColor(order.status)}">${order.status}</span>
      </div>
      <p>رقم الجوال: ${order.customer_phone}</p>
      <p>الطلب: ${order.order_text}</p>
      ${order.rider_name ? `<p>🚴‍♂️ المندوب: ${order.rider_name}</p>` : ""}
      <div class="d-flex flex-wrap gap-2 mt-2">
        <button class="btn btn-sm btn-outline-primary" onclick="viewLocation(${order.lat}, ${order.lng})">عرض الموقع</button>
        <button class="btn btn-sm btn-warning" onclick="updateStatus(${order.id}, 'قيد التجهيز')">قيد التجهيز</button>
        <button class="btn btn-sm btn-success" onclick="openAssignModal(${order.id})">خرج للتوصيل</button>
        <button class="btn btn-sm btn-dark" onclick="updateStatus(${order.id}, 'تم التوصيل')">تم التوصيل</button>
        <button class="btn btn-sm btn-danger" onclick="updateStatus(${order.id}, 'تم الإلغاء')">إلغاء</button>
      </div>`;
    container.appendChild(card);
  });
}

function getStatusColor(status) {
  return {
    "جديد": "#2196f3",
    "قيد التجهيز": "#ff9800",
    "قيد التوصيل": "#9c27b0",
    "تم التوصيل": "#4caf50",
    "تم الإلغاء": "#f44336",
  }[status] || "#ccc";
}

async function updateStatus(orderId, status) {
  if (!confirm(`هل تريد تغيير الحالة إلى: ${status}؟`)) return;
  try {
    const res = await fetch(`${API_BASE_URL}/store/status/${orderId}`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "فشل تحديث الحالة");

    // إرسال رسالة واتساب عند قيد التجهيز
    if (status === "قيد التجهيز" && data.whatsapp_link) {
      window.open(data.whatsapp_link, "_blank");
    }

    fetchStoreOrders();
  } catch (err) {
    alert(err.message);
  }
}

function viewLocation(lat, lng) {
  if (!lat || !lng) {
    alert("لا يوجد موقع لهذا الطلب");
    return;
  }
  window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
}

async function openAssignModal(orderId) {
  selectedOrderId = orderId;
  try {
    const res = await fetch(`${API_BASE_URL}/store/available-riders`, {
      headers: { Authorization: "Bearer " + token },
    });
    const riders = await res.json();
    const select = document.getElementById("riderSelect");
    if (riders.length === 0) {
      select.innerHTML = `<option disabled selected>لا يوجد مناديب متاحين حالياً</option>`;
    } else {
      select.innerHTML = riders.map((r) =>
        `<option value="${r.id}">${r.name} - ${r.phone}</option>`
      ).join("");
    }
    new bootstrap.Modal(document.getElementById("assignModal")).show();
  } catch (err) {
    alert("فشل تحميل المناديب: " + err.message);
  }
}

async function confirmAssign() {
  const riderId = document.getElementById("riderSelect").value;
  const amount = document.getElementById("amountInput").value;
  if (!riderId || !amount) return alert("يرجى اختيار المندوب وإدخال المبلغ");

  try {
    const res = await fetch(`${API_BASE_URL}/store/assign/${selectedOrderId}`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rider_id: Number(riderId), amount: Number(amount) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "فشل إسناد الطلب");

    // إرسال روابط واتساب
    if (data.rider_whatsapp) window.open(data.rider_whatsapp, "_blank");
    if (data.customer_whatsapp) window.open(data.customer_whatsapp, "_blank");

    bootstrap.Modal.getInstance(document.getElementById("assignModal")).hide();
    fetchStoreOrders();
  } catch (err) {
    alert("فشل الإسناد: " + err.message);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "/store/login.html";
}
