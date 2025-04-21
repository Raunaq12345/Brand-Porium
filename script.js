// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6PixU939MD3oyefyfzPoFH2BYx8K635o",
  authDomain: "brand-porium.firebaseapp.com",
  projectId: "brand-porium",
  storageBucket: "brand-porium.appspot.com",
  messagingSenderId: "848904977548",
  appId: "1:848904977548:web:0f25ee7506536cdb8c4fa9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get auth and firestore instances
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Auth state observer
auth.onAuthStateChanged((user) => {
  const authButtons = document.getElementById('authButtons');
  if (user) {
    // User is signed in
    authButtons.innerHTML = `
      <span>Welcome, ${user.email}</span>
      <button id="logoutBtn" onclick="logout()">Logout</button>
    `;
  } else {
    // User is signed out
    authButtons.innerHTML = `
      <button id="loginBtn" onclick="showLoginForm()">Login</button>
      <button id="signupBtn" onclick="showSignupForm()">Sign Up</button>
    `;
  }
});

// Authentication functions
function showLoginForm() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="auth-form">
      <h2>Brand Porium - Login / Signup</h2>
      <input type="email" id="email" placeholder="Email" />
      <input type="password" id="password" placeholder="Password" />
      <div class="button-group">
        <button onclick="signup()">Sign Up</button>
        <button onclick="login()">Log In</button>
        <button onclick="logout()">Log Out</button>
      </div>
      <p id="status"></p>
    </div>
  `;
}

// We'll use the same form for both login and signup
showLoginForm();

function updateStatus(message) {
  document.getElementById('status').textContent = message;
}

// Sign up function
function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      document.getElementById("status").innerText = "Signup successful!";
    })
    .catch(error => {
      document.getElementById("status").innerText = error.message;
    });
}

// Login function
function logIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      document.getElementById("status").innerText = "Login successful!";
    })
    .catch(error => {
      document.getElementById("status").innerText = error.message;
    });
}

// Logout function
function logOut() {
  auth.signOut().then(() => {
    document.getElementById("status").innerText = "Logged out.";
  });
}

function showUploadForm() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="product-form">
      <h3>Upload Product</h3>
      <input type="text" id="productName" placeholder="Product Name" /><br><br>
      <input type="text" id="brand" placeholder="Brand" /><br><br>
      <h4>Size Matrix (enter quantity)</h4>
      <table border="1" style="text-align: center; width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 8px; background-color: #f2f2f2;">Size</th>
          <th style="padding: 8px; background-color: #f2f2f2;">Qty</th>
        </tr>
        <tr><td style="padding: 8px;">S</td><td style="padding: 8px;"><input type="number" id="sizeS" value="0" min="0" style="width: 80px;" /></td></tr>
        <tr><td style="padding: 8px;">M</td><td style="padding: 8px;"><input type="number" id="sizeM" value="0" min="0" style="width: 80px;" /></td></tr>
        <tr><td style="padding: 8px;">L</td><td style="padding: 8px;"><input type="number" id="sizeL" value="0" min="0" style="width: 80px;" /></td></tr>
        <tr><td style="padding: 8px;">XL</td><td style="padding: 8px;"><input type="number" id="sizeXL" value="0" min="0" style="width: 80px;" /></td></tr>
        <tr><td style="padding: 8px;">XXL</td><td style="padding: 8px;"><input type="number" id="sizeXXL" value="0" min="0" style="width: 80px;" /></td></tr>
      </table><br>
      <input type="text" id="color" placeholder="Color" /><br><br>
      <input type="number" id="price" placeholder="Price" /><br><br>
      <input type="text" id="supplier" placeholder="Supplier Name" /><br><br>
      <input type="file" id="productImage" accept="image/*" /><br><br>
      <button onclick="uploadProduct()">Upload Product</button>
      <p id="uploadStatus"></p>
      
      <h3>Uploaded Products</h3>
      <div id="productList"></div>
      <button onclick="loadProducts()">Refresh List</button>
    </div>
  `;
}

function uploadProduct() {
  const imageFile = document.getElementById("productImage").files[0];
  const imageName = `${Date.now()}_${imageFile.name}`;
  const storageRef = firebase.storage().ref(`productImages/${imageName}`);

  // Upload image to Firebase Storage
  storageRef.put(imageFile)
    .then(snapshot => snapshot.ref.getDownloadURL())
    .then(imageUrl => {
      const sizes = {
        S: parseInt(document.getElementById("sizeS").value) || 0,
        M: parseInt(document.getElementById("sizeM").value) || 0,
        L: parseInt(document.getElementById("sizeL").value) || 0,
        XL: parseInt(document.getElementById("sizeXL").value) || 0,
        XXL: parseInt(document.getElementById("sizeXXL").value) || 0
      };

      const product = {
        name: document.getElementById("productName").value,
        brand: document.getElementById("brand").value,
        color: document.getElementById("color").value,
        price: parseFloat(document.getElementById("price").value),
        supplier: document.getElementById("supplier").value,
        sizes: sizes,
        imageUrl: imageUrl,
        createdAt: new Date()
      };

      return db.collection("products").add(product);
    })
    .then(() => {
      document.getElementById("uploadStatus").innerText = "Product and image uploaded!";
    })
    .catch((error) => {
      document.getElementById("uploadStatus").innerText = error.message;
    });
}

function filterProducts() {
  const brandFilter = document.getElementById("searchBrand").value.trim().toLowerCase();
  const sizeFilter = document.getElementById("searchSize").value.trim().toLowerCase();
  const listDiv = document.getElementById("productList");
  listDiv.innerHTML = "Loading...";

  db.collection("products").orderBy("createdAt", "desc").get()
    .then(snapshot => {
      listDiv.innerHTML = "";

      const filtered = snapshot.docs.filter(doc => {
        const data = doc.data();
        const brandMatch = brandFilter === "" || data.brand.toLowerCase().includes(brandFilter);
        const sizeMatch = sizeFilter === "" || data.size.toLowerCase().includes(sizeFilter);
        return brandMatch && sizeMatch;
      });

      if (filtered.length === 0) {
        listDiv.innerHTML = "No matching products.";
        return;
      }

      filtered.forEach(doc => {
        const data = doc.data();

        const item = document.createElement("div");
        item.style.border = "1px solid #ccc";
        item.style.margin = "10px";
        item.style.padding = "10px";
        item.style.borderRadius = "8px";

        item.innerHTML = `
          <img src="${data.imageUrl}" width="100" height="100"><br>
          <strong>${data.name}</strong><br>
          Brand: ${data.brand}<br>
          Sizes: S(${data.sizes?.S || 0}), M(${data.sizes?.M || 0}), L(${data.sizes?.L || 0}), XL(${data.sizes?.XL || 0})<br>
          Color: ${data.color}<br>
          Price: ₹${data.price}<br>
          Qty: ${data.quantity}<br>
          Supplier: ${data.supplier}<br>
        `;

        listDiv.appendChild(item);
      });
    })
    .catch(error => {
      listDiv.innerHTML = "Error filtering products: " + error.message;
    });
}

function loadProducts() {
  const listDiv = document.getElementById("productList");
  listDiv.innerHTML = "Loading...";

  db.collection("products").orderBy("createdAt", "desc").get()
    .then(snapshot => {
      listDiv.innerHTML = "";
      if (snapshot.empty) {
        listDiv.innerHTML = "No products found.";
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const docId = doc.id;

        const item = document.createElement("div");
        item.style.border = "1px solid #ccc";
        item.style.margin = "10px";
        item.style.padding = "10px";
        item.style.borderRadius = "8px";

        const sizeMatrix = `
          S: <input type="number" id="sizeS-${docId}" value="${data.sizes?.S ?? 0}" /><br>
          M: <input type="number" id="sizeM-${docId}" value="${data.sizes?.M ?? 0}" /><br>
          L: <input type="number" id="sizeL-${docId}" value="${data.sizes?.L ?? 0}" /><br>
          XL: <input type="number" id="sizeXL-${docId}" value="${data.sizes?.XL ?? 0}" /><br>
          XXL: <input type="number" id="sizeXXL-${docId}" value="${data.sizes?.XXL ?? 0}" /><br>
        `;

        item.innerHTML = `
          <img src="${data.imageUrl}" width="100" height="100"><br>
          <strong>${data.name}</strong><br>
          Brand: ${data.brand}<br>
          Color: ${data.color}<br>
          Price: ₹${data.price}<br>
          Supplier: ${data.supplier}<br>
          ${sizeMatrix}
          <button onclick="updateProductSizes('${docId}')">Update Sizes</button>
        `;

        listDiv.appendChild(item);
      });
    })
    .catch(error => {
      listDiv.innerHTML = "Error loading products: " + error.message;
    });
}

function updateProductSizes(docId) {
  const updatedSizes = {
    S: parseInt(document.getElementById(`sizeS-${docId}`).value) || 0,
    M: parseInt(document.getElementById(`sizeM-${docId}`).value) || 0,
    L: parseInt(document.getElementById(`sizeL-${docId}`).value) || 0,
    XL: parseInt(document.getElementById(`sizeXL-${docId}`).value) || 0,
    XXL: parseInt(document.getElementById(`sizeXXL-${docId}`).value) || 0
  };

  db.collection("products").doc(docId).update({
    sizes: updatedSizes
  })
    .then(() => {
      alert("Sizes updated successfully!");
      loadProducts(); // Refresh the product list to show updated sizes
    })
    .catch(error => {
      alert("Error updating sizes: " + error.message);
    });
}