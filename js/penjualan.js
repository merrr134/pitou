document.addEventListener('DOMContentLoaded', function() {
    const SALES_STORAGE_KEY = 'sales';
    const TABLE_BODY = document.getElementById('dataPenjualanTableBody');
    const SALES_FORM = document.getElementById('salesForm');
    const ADD_EDIT_MODAL = new bootstrap.Modal(document.getElementById('tambahPenjualanModal'));
    const MODAL_TITLE = document.getElementById('tambahPenjualanModalLabel');

    // Form inputs
    const INPUT_ID = document.getElementById('editSalesId'); // Hidden input for editing
    const INPUT_PRODUK_PENJUALAN = document.getElementById('inputProdukPenjualan');
    const INPUT_TANGGAL_PENJUALAN = document.getElementById('inputTanggalPenjualan');
    const INPUT_JUMLAH_PENJUALAN = document.getElementById('inputJumlahPenjualan');
    const INPUT_HARGA_JUAL_SATUAN = document.getElementById('inputHargaJualSatuan');
    const INPUT_TOTAL_HARGA_JUAL = document.getElementById('inputTotalHargaJual');
    const INPUT_LABA_BERSIH = document.getElementById('inputLabaBersih');
    const INPUT_METODE_PEMBAYARAN = document.getElementById('inputMetodePembayaran');
    const INPUT_CATATAN_PENJUALAN = document.getElementById('inputCatatanPenjualan');

    // Search input
    const SEARCH_INPUT = document.getElementById('searchPenjualan');

    let sales = []; // Array to store sales records
    let products = []; // Array to store product data from script.js

    // --- Utility Functions ---
    function getSalesFromLocalStorage() {
        const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
        return storedSales ? JSON.parse(storedSales) : [];
    }

    function saveSalesToLocalStorage(salesArray) {
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesArray));
    }

    // saveProductsData is now a global function from script.js
    // function saveProductsToLocalStorage(productsArray) {
    //     localStorage.setItem('products', JSON.stringify(productsArray));
    // }

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // --- Populate Product Dropdown ---
    function populateProductDropdown() {
        // Ensure products data is available (from script.js's global function)
        products = typeof getProductsData === 'function' ? getProductsData() : [];

        INPUT_PRODUK_PENJUALAN.innerHTML = '<option value="">Pilih Produk...</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id; // Use product ID as value
            option.textContent = `${product.namaProduk} (${product.kodeProduk})`;
            option.dataset.hargaJual = product.hargaJual;
            option.dataset.hargaModal = product.hargaModal;
            option.dataset.perluStok = product.perluStok;
            option.dataset.stokTersisa = product.stokTersisa; // For stock check
            INPUT_PRODUK_PENJUALAN.appendChild(option);
        });
    }

    // --- Calculate Sales Details ---
    function calculateSalesDetails() {
        const selectedOption = INPUT_PRODUK_PENJUALAN.options[INPUT_PRODUK_PENJUALAN.selectedIndex];
        if (!selectedOption || !selectedOption.value) {
            INPUT_HARGA_JUAL_SATUAN.value = '';
            INPUT_TOTAL_HARGA_JUAL.value = '';
            INPUT_LABA_BERSIH.value = '';
            return;
        }

        const hargaJualSatuan = parseFloat(selectedOption.dataset.hargaJual) || 0;
        const hargaModalSatuan = parseFloat(selectedOption.dataset.hargaModal) || 0;
        const jumlah = parseInt(INPUT_JUMLAH_PENJUALAN.value) || 0;

        INPUT_HARGA_JUAL_SATUAN.value = hargaJualSatuan;
        INPUT_TOTAL_HARGA_JUAL.value = hargaJualSatuan * jumlah;
        INPUT_LABA_BERSIH.value = (hargaJualSatuan - hargaModalSatuan) * jumlah;
    }

    // --- Render Sales to Table ---
    function renderSales() {
        TABLE_BODY.innerHTML = ''; // Clear existing rows
        const filteredSales = filterAndSearchSales(sales);

        if (filteredSales.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="11" class="text-center">Tidak ada catatan penjualan ditemukan.</td></tr>`;
            return;
        }

        filteredSales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.idTransaksi}</td>
                <td>${formatDate(sale.tanggal)}</td>
                <td>${sale.namaProduk}</td>
                <td>${sale.kodeProduk}</td>
                <td>${sale.jumlah}</td>
                <td>${formatRupiah(sale.hargaJualSatuan)}</td>
                <td>${formatRupiah(sale.totalHargaJual)}</td>
                <td>${formatRupiah(sale.labaBersih)}</td>
                <td>${sale.metodePembayaran}</td>
                <td>${sale.catatan || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1 edit-btn" data-id="${sale.idTransaksi}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${sale.idTransaksi}">Hapus</button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });

        addEventListenersToButtons();
    }

    // --- Search Logic ---
    function filterAndSearchSales(salesToFilter) {
        const searchTerm = SEARCH_INPUT.value.toLowerCase();

        return salesToFilter.filter(sale => {
            const matchesSearch = sale.idTransaksi.toLowerCase().includes(searchTerm) ||
                                  sale.namaProduk.toLowerCase().includes(searchTerm) ||
                                  sale.kodeProduk.toLowerCase().includes(searchTerm) ||
                                  (sale.catatan && sale.catatan.toLowerCase().includes(searchTerm)); // Check if catatan exists
            return matchesSearch;
        });
    }

    // --- Add/Edit Sales Functions ---
    function resetForm() {
        SALES_FORM.reset();
        INPUT_ID.value = '';
        MODAL_TITLE.textContent = 'Catat Penjualan Baru';
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        INPUT_TANGGAL_PENJUALAN.value = today;
        populateProductDropdown(); // Repopulate dropdown to refresh stock data
        calculateSalesDetails(); // Clear calculated fields
    }

    function addSale(newSale) {
        sales.push(newSale);
        saveSalesToLocalStorage(sales);
        renderSales();
    }

    function updateSale(updatedSale) {
        sales = sales.map(s => s.idTransaksi === updatedSale.idTransaksi ? updatedSale : s);
        saveSalesToLocalStorage(sales);
        renderSales();
    }

    function deleteSale(id) {
        if (confirm('Apakah Anda yakin ingin menghapus catatan penjualan ini? Ini akan mengembalikan stok produk jika relevan.')) {
            const deletedSale = sales.find(sale => sale.idTransaksi === id);
            if (deletedSale && deletedSale.perluStok) {
                // Return stock
                const product = products.find(p => p.id === deletedSale.productId);
                if (product) {
                    product.stokTerjual = (product.stokTerjual || 0) - deletedSale.jumlah;
                    product.stokTersisa = (product.stokTersisa || 0) + deletedSale.jumlah;
                    saveProductsData(products); // Use global save function to update products array in localStorage
                }
            }
            sales = sales.filter(sale => sale.idTransaksi !== id);
            saveSalesToLocalStorage(sales);
            renderSales();
            populateProductDropdown(); // Refresh dropdown for accurate stock info after deletion
        }
    }

    // --- Event Listeners ---
    SALES_FORM.addEventListener('submit', function(event) {
        event.preventDefault();

        const idTransaksi = INPUT_ID.value || `TRX-${Date.now()}`; // Use existing ID or generate new unique ID
        const selectedOption = INPUT_PRODUK_PENJUALAN.options[INPUT_PRODUK_PENJUALAN.selectedIndex];

        if (!selectedOption || !selectedOption.value) {
            alert('Mohon pilih produk.');
            return;
        }

        const productId = selectedOption.value;
        const namaProduk = selectedOption.textContent.split('(')[0].trim();
        const kodeProduk = selectedOption.textContent.split('(')[1].replace(')', '').trim();
        const tanggal = INPUT_TANGGAL_PENJUALAN.value;
        const jumlah = parseInt(INPUT_JUMLAH_PENJUALAN.value);
        const hargaJualSatuan = parseFloat(INPUT_HARGA_JUAL_SATUAN.value);
        const totalHargaJual = parseFloat(INPUT_TOTAL_HARGA_JUAL.value);
        const labaBersih = parseFloat(INPUT_LABA_BERSIH.value);
        const metodePembayaran = INPUT_METODE_PEMBAYARAN.value;
        const catatan = INPUT_CATATAN_PENJUALAN.value.trim();
        const perluStok = selectedOption.dataset.perluStok === 'true'; // Convert string to boolean

        // Basic validation
        if (!tanggal || !jumlah || isNaN(jumlah) || !metodePembayaran) {
            alert('Mohon lengkapi semua data yang diperlukan.');
            return;
        }
        if (jumlah <= 0) {
            alert('Jumlah penjualan harus lebih dari 0.');
            return;
        }

        const currentProductState = products.find(p => p.id === productId);

        if (perluStok) {
            if (INPUT_ID.value) { // Editing an existing sale
                const originalSale = sales.find(s => s.idTransaksi === idTransaksi);
                const originalJumlah = originalSale ? originalSale.jumlah : 0;
                const changeInJumlah = jumlah - originalJumlah;

                // Check stock only if quantity is increasing or product is the same
                if (currentProductState && currentProductState.id === productId && currentProductState.stokTersisa < changeInJumlah) {
                    alert(`Stok tersisa untuk ${namaProduk} tidak cukup untuk perubahan ini. Stok saat ini: ${currentProductState.stokTersisa}`);
                    return;
                }
                // Adjust stock based on change in quantity
                currentProductState.stokTerjual = (currentProductState.stokTerjual || 0) + changeInJumlah;
                currentProductState.stokTersisa = (currentProductState.stokTersisa || 0) - changeInJumlah;

            } else { // Adding a new sale
                if (currentProductState.stokTersisa < jumlah) {
                    alert(`Stok tersisa untuk ${namaProduk} tidak cukup. Stok saat ini: ${currentProductState.stokTersisa}`);
                    return;
                }
                currentProductState.stokTerjual = (currentProductState.stokTerjual || 0) + jumlah;
                currentProductState.stokTersisa = (currentProductState.stokTersisa || 0) - jumlah;
            }
            saveProductsData(products); // Use global save function to save updated product stock
        }


        const newSale = {
            idTransaksi: idTransaksi,
            productId: productId, // Store product ID for linking
            namaProduk: namaProduk,
            kodeProduk: kodeProduk,
            tanggal: tanggal,
            jumlah: jumlah,
            hargaJualSatuan: hargaJualSatuan,
            totalHargaJual: totalHargaJual,
            labaBersih: labaBersih,
            metodePembayaran: metodePembayaran,
            catatan: catatan,
            perluStok: perluStok // Store this to properly revert stock on delete
        };

        if (INPUT_ID.value) {
            updateSale(newSale);
        } else {
            addSale(newSale);
        }

        ADD_EDIT_MODAL.hide();
        resetForm();
    });

    // Populate Harga Jual Satuan, Total, and Laba Bersih when product or quantity changes
    INPUT_PRODUK_PENJUALAN.addEventListener('change', calculateSalesDetails);
    INPUT_JUMLAH_PENJUALAN.addEventListener('input', calculateSalesDetails);

    function addEventListenersToButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => {
                const idToEdit = e.target.dataset.id;
                const saleToEdit = sales.find(s => s.idTransaksi === idToEdit);

                if (saleToEdit) {
                    MODAL_TITLE.textContent = 'Edit Penjualan';
                    INPUT_ID.value = saleToEdit.idTransaksi;
                    INPUT_TANGGAL_PENJUALAN.value = saleToEdit.tanggal; // Assuming format is YYYY-MM-DD
                    INPUT_JUMLAH_PENJUALAN.value = saleToEdit.jumlah;
                    INPUT_METODE_PEMBAYARAN.value = saleToEdit.metodePembayaran;
                    INPUT_CATATAN_PENJUALAN.value = saleToEdit.catatan;

                    // Select the correct product in the dropdown
                    INPUT_PRODUK_PENJUALAN.value = saleToEdit.productId;
                    // Trigger change to update calculated fields
                    calculateSalesDetails();

                    ADD_EDIT_MODAL.show();
                }
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                deleteSale(e.target.dataset.id);
            };
        });
    }

    // Initialize data and render on page load
    products = typeof getProductsData === 'function' ? getProductsData() : [];
    sales = getSalesFromLocalStorage();
    populateProductDropdown(); // Populate dropdown initially
    renderSales();

    // Set default date for new sale
    const today = new Date().toISOString().split('T')[0];
    INPUT_TANGGAL_PENJUALAN.value = today;

    // Event listener for search
    SEARCH_INPUT.addEventListener('keyup', renderSales);

    // Reset form when modal is hidden
    document.getElementById('tambahPenjualanModal').addEventListener('hidden.bs.modal', resetForm);
});
