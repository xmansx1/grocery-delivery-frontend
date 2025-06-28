// 📁 store_orders.js - سكربت إدارة الطلبات في واجهة المتجر

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("store_token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const API = `${API_BASE_URL}/store/orders`;
  const ordersContainer = document.getElementById("ordersContainer");

  fetch(API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((orders) => {
      ordersContainer.innerHTML = "";
      orders.forEach((order) => {
        const card = document.createElement("div");
        card.className = "order-card";
        card.innerHTML = `
          <h5>العميل: ${order.customer_name}</h5>
          <p>رقم الجوال: ${order.customer_phone}</p>
          <p>الطلب: ${order.order_text}</p>
          <p>الحالة: <span class="badge-status badge-${order.status}">${order.status}</span></p>
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-sm btn-warning" onclick="updateStatus(${order.id}, 'قيد التجهيز')">قيد التجهيز</button>
            <button class="btn btn-sm btn-primary" onclick="openAssign(${order.id})">خرج للتوصيل</button>
            <button class="btn btn-sm btn-success" onclick="updateStatus(${order.id}, 'تم التوصيل')">تم التوصيل</button>
            <button class="btn btn-sm btn-danger" onclick="updateStatus(${order.id}, 'تم الإلغاء')">إلغاء</button>
          </div>
        `;
        ordersContainer.appendChild(card);
      });
    })
    .catch((err) => {
      ordersContainer.innerHTML = "<p class='text-danger'>فشل في جلب الطلبات</p>";
    });
});

function updateStatus(orderId, newStatus) {
  const token = localStorage.getItem("store_token");
  fetch(`${API_BASE_URL}/store/orders/${orderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: newStatus }),
  })
    .then((res) => res.json())
    .then(() => location.reload());
}

function openAssign(orderId) {
  const amount = prompt("أدخل مبلغ الطلب");
  if (!amount) return;
  const riderId = prompt("أدخل رقم هوية المندوب");
  if (!riderId) return;

  const token = localStorage.getItem("store_token");
  fetch(`${API_BASE_URL}/store/orders/${orderId}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rider_id: Number(riderId), amount: Number(amount) }),
  })
    .then((res) => res.json())
    .then(() => location.reload());
}
