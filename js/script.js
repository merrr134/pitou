// This function will be globally accessible to other scripts
function getProductsData() {
    const PRODUCT_STORAGE_KEY = 'products';
    const storedProducts = localStorage.getItem(PRODUCT_STORAGE_KEY);
    return storedProducts ? JSON.parse(storedProducts) : [];
}

// This function will be globally accessible to other scripts
function saveProductsData(productsArray) {
    const PRODUCT_STORAGE_KEY = 'products';
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(productsArray));
}


document.addEventListener('DOMContentLoaded', function() {
    const PRODUCT_STORAGE_KEY = 'products';
    const TABLE_BODY = document.getElementById('dataProdukTableBody');
    const PRODUCT_FORM = document.getElementById('productForm');
    const ADD_EDIT_MODAL = new bootstrap.Modal(document.getElementById('tambahProdukModal'));
    const MODAL_TITLE = document.getElementById('tambahProdukModalLabel');

    // Form inputs
    const INPUT_ID = document.getElementById('editProductId'); // Hidden input for editing
    const INPUT_KODE_PRODUK = document.getElementById('inputKodeProduk');
    const INPUT_NAMA_PRODUK = document.getElementById('inputNamaProduk');
    const INPUT_KATEGORI = document.getElementById('inputKategori');
    const INPUT_HARGA_MODAL = document.getElementById('inputHargaModal');
    const INPUT_HARGA_JUAL = document.getElementById('inputHargaJual');
    const INPUT_PERLU_STOK = document.getElementById('inputPerluStok');
    const STOK_INPUTS_DIV = document.getElementById('stokInputs');
    const INPUT_STOK_AWAL = document.getElementById('inputStokAwal');

    // Search and filter elements
    const SEARCH_INPUT = document.getElementById('searchProduk');
    const FILTER_SELECT = document.getElementById('filterKategori');

    // IMPORTANT CHANGE: Initialize products from localStorage using the global function
    let products = getProductsData();

    // --- Utility Functions ---
    // Moved getProductsFromLocalStorage to global function getProductsData()
    // Moved saveProductsToLocalStorage to global function saveProductsData()

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }

    // --- Render Products to Table ---
    function renderProducts() {
        TABLE_BODY.innerHTML = ''; // Clear existing rows
        const filteredProducts = filterAndSearchProducts(products);

        if (filteredProducts.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="11" class="text-center">Tidak ada produk ditemukan.</td></tr>`;
            return;
        }

        filteredProducts.forEach(product => {
            const row = document.createElement('tr');

            const hargaModalNum = parseFloat(product.hargaModal) || 0;
            const hargaJualNum = parseFloat(product.hargaJual) || 0;
            const labaPerItem = hargaJualNum - hargaModalNum;

            const stokAwalDisplay = product.perluStok ? (product.stokAwal || 0) : '-';
            const stokTerjualDisplay = product.perluStok ? (product.stokTerjual || 0) : '-';
            const stokTersisaDisplay = product.perluStok ? (product.stokTersisa || 0) : '-';

            row.innerHTML = `
                <td>${product.kodeProduk}</td>
                <td>${product.namaProduk}</td>
                <td>${product.kategori}</td>
                <td>${formatRupiah(hargaModalNum)}</td>
                <td>${formatRupiah(hargaJualNum)}</td>
                <td>${formatRupiah(labaPerItem)}</td>
                <td>${product.perluStok ? 'Ya' : 'Tidak'}</td>
                <td>${stokAwalDisplay}</td>
                <td>${stokTerjualDisplay}</td>
                <td>${stokTersisaDisplay}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1 edit-btn" data-id="${product.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${product.id}">Hapus</button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });

        addEventListenersToButtons();
    }

    // --- Search and Filter Logic ---
    function filterAndSearchProducts(productsToFilter) {
        const searchTerm = SEARCH_INPUT.value.toLowerCase();
        const selectedCategory = FILTER_SELECT.value.toLowerCase();

        return productsToFilter.filter(product => {
            const matchesSearch = product.kodeProduk.toLowerCase().includes(searchTerm) ||
                                  product.namaProduk.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === '' || product.kategori.toLowerCase() === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }

    // --- Add/Edit Product Functions ---
    function resetForm() {
        PRODUCT_FORM.reset();
        INPUT_ID.value = '';
        MODAL_TITLE.textContent = 'Tambah Produk Baru';
        STOK_INPUTS_DIV.style.display = 'none'; // Hide stok inputs by default
        INPUT_PERLU_STOK.checked = false; // Uncheck "Perlu Stok?"
    }

    function addProduct(newProduct) {
        products.push(newProduct);
        saveProductsData(products); // Use global save function
        renderProducts();
    }

    function updateProduct(updatedProduct) {
        products = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        saveProductsData(products); // Use global save function
        renderProducts();
    }

    function deleteProduct(id) {
        if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
            products = products.filter(product => product.id !== id);
            saveProductsData(products); // Use global save function
            renderProducts();
        }
    }

    // --- Event Listeners ---
    PRODUCT_FORM.addEventListener('submit', function(event) {
        event.preventDefault();

        const id = INPUT_ID.value || Date.now().toString(); // Use existing ID or generate new unique ID
        const kodeProduk = INPUT_KODE_PRODUK.value.trim();
        const namaProduk = INPUT_NAMA_PRODUK.value.trim();
        const kategori = INPUT_KATEGORI.value;
        const hargaModal = parseFloat(INPUT_HARGA_MODAL.value);
        const hargaJual = parseFloat(INPUT_HARGA_JUAL.value);
        const perluStok = INPUT_PERLU_STOK.checked;
        const stokAwal = perluStok ? (parseInt(INPUT_STOK_AWAL.value) || 0) : 0;

        // Basic validation
        if (!kodeProduk || !namaProduk || !kategori || isNaN(hargaModal) || isNaN(hargaJual) || (perluStok && isNaN(stokAwal))) {
            alert('Mohon lengkapi semua data yang diperlukan.');
            return;
        }

        const newProduct = {
            id: id,
            kodeProduk: kodeProduk,
            namaProduk: namaProduk,
            kategori: kategori,
            hargaModal: hargaModal,
            hargaJual: hargaJual,
            perluStok: perluStok,
            stokAwal: stokAwal,
            stokTerjual: 0, // Always start at 0 for new products
            stokTersisa: stokAwal // Initially stokAwal for new products
        };

        if (INPUT_ID.value) {
            // Editing existing product
            // Preserve stokTerjual and recalculate stokTersisa if editing an existing product
            const existingProduct = products.find(p => p.id === id);
            if (existingProduct) {
                newProduct.stokTerjual = existingProduct.stokTerjual;
                newProduct.stokTersisa = newProduct.stokAwal - newProduct.stokTerjual;
            }
            updateProduct(newProduct);
        } else {
            // Adding new product
            addProduct(newProduct);
        }

        ADD_EDIT_MODAL.hide();
        resetForm();
    });

    INPUT_PERLU_STOK.addEventListener('change', function() {
        if (this.checked) {
            STOK_INPUTS_DIV.style.display = 'block';
        } else {
            STOK_INPUTS_DIV.style.display = 'none';
            INPUT_STOK_AWAL.value = ''; // Clear stok awal if not needed
        }
    });

    function addEventListenersToButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => {
                const idToEdit = e.target.dataset.id;
                const productToEdit = products.find(p => p.id === idToEdit);

                if (productToEdit) {
                    MODAL_TITLE.textContent = 'Edit Produk';
                    INPUT_ID.value = productToEdit.id;
                    INPUT_KODE_PRODUK.value = productToEdit.kodeProduk;
                    INPUT_NAMA_PRODUK.value = productToEdit.namaProduk;
                    INPUT_KATEGORI.value = productToEdit.kategori;
                    INPUT_HARGA_MODAL.value = productToEdit.hargaModal;
                    INPUT_HARGA_JUAL.value = productToEdit.hargaJual;
                    INPUT_PERLU_STOK.checked = productToEdit.perluStok;

                    if (productToEdit.perluStok) {
                        STOK_INPUTS_DIV.style.display = 'block';
                        INPUT_STOK_AWAL.value = productToEdit.stokAwal;
                    } else {
                        STOK_INPUTS_DIV.style.display = 'none';
                        INPUT_STOK_AWAL.value = '';
                    }

                    ADD_EDIT_MODAL.show();
                }
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                deleteProduct(e.target.dataset.id);
            };
        });
    }

    // Initialize data and render on page load
    renderProducts();

    // Event listeners for search and filter
    SEARCH_INPUT.addEventListener('keyup', renderProducts);
    FILTER_SELECT.addEventListener('change', renderProducts);

    // Reset form when modal is hidden
    document.getElementById('tambahProdukModal').addEventListener('hidden.bs.modal', resetForm);
});
