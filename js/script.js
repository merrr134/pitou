// Fungsi global untuk mendapatkan data produk dari localStorage
function getProductsData() {
    const PRODUCT_STORAGE_KEY = 'products';
    const storedProducts = localStorage.getItem(PRODUCT_STORAGE_KEY);
    return storedProducts ? JSON.parse(storedProducts) : [];
}

// Fungsi global untuk menyimpan data produk ke localStorage
function saveProductsData(productsArray) {
    const PRODUCT_STORAGE_KEY = 'products';
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(productsArray));
}

document.addEventListener('DOMContentLoaded', function() {
    const TABLE_BODY = document.getElementById('dataProdukTableBody');
    const PRODUCT_FORM = document.getElementById('productForm');
    const ADD_EDIT_MODAL = new bootstrap.Modal(document.getElementById('tambahProdukModal'));
    const MODAL_TITLE = document.getElementById('tambahProdukModalLabel');

    // Elemen Form
    const INPUT_ID = document.getElementById('editProductId');
    const INPUT_KODE_PRODUK = document.getElementById('inputKodeProduk');
    const INPUT_NAMA_PRODUK = document.getElementById('inputNamaProduk');
    const INPUT_KATEGORI = document.getElementById('inputKategori');
    const INPUT_HARGA_MODAL = document.getElementById('inputHargaModal');
    const INPUT_HARGA_JUAL = document.getElementById('inputHargaJual');
    const INPUT_PERLU_STOK = document.getElementById('inputPerluStok');
    const STOK_INPUTS_DIV = document.getElementById('stokInputs');
    const INPUT_STOK_AWAL = document.getElementById('inputStokAwal');

    // Elemen Filter dan Pencarian
    const SEARCH_INPUT = document.getElementById('searchProduk');
    const FILTER_SELECT = document.getElementById('filterKategori');

    let products = getProductsData();

    // --- FUNGSI BARU: GENERATOR KODE PRODUK ---
    function generateProductCode() {
        if (INPUT_ID.value) {
            INPUT_KODE_PRODUK.readOnly = true;
            return;
        }
        
        INPUT_KODE_PRODUK.readOnly = false;

        const kategori = INPUT_KATEGORI.value;
        const namaProduk = INPUT_NAMA_PRODUK.value;

        if (!kategori || !namaProduk) {
            INPUT_KODE_PRODUK.value = '';
            return;
        }

        const KODE_KATEGORI_MAP = {
            'Top up diamond': 'DM',
            'Aplikasi premium': 'APP',
            'Kebutuhan Sosmed': 'SOSMED',
            'Gift charisma': 'GCHAR',
            'Gift skin': 'GSKIN',
            'Gift item': 'GITEM',
            'Gift Starlight': 'GSTAR'
        };

        const kodeKategori = KODE_KATEGORI_MAP[kategori] || 'PROD';
        const angka = (namaProduk.match(/\d/g) || []).join('');
        const hurufBesar = (namaProduk.match(/[A-Z]/g) || []).join('');
        let singkatanNama = (hurufBesar + angka).toUpperCase();
        
        if (!hurufBesar) {
            singkatanNama = (namaProduk.split(' ').map(kata => kata.charAt(0)).join('') + angka).toUpperCase();
        }

        const finalCode = `${kodeKategori}-${singkatanNama}`;
        INPUT_KODE_PRODUK.value = finalCode;
    }

    function formatRupiah(number) {
        if (isNaN(number)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }

    function renderProducts() {
        TABLE_BODY.innerHTML = '';
        const filteredProducts = filterAndSearchProducts(products);

        if (filteredProducts.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="11" class="text-center p-4">Tidak ada produk yang sesuai dengan kriteria.</td></tr>`;
            return;
        }

        filteredProducts.forEach(product => {
            const row = document.createElement('tr');
            const hargaModalNum = parseFloat(product.hargaModal) || 0;
            const hargaJualNum = parseFloat(product.hargaJual) || 0;
            const labaPerItem = hargaJualNum - hargaModalNum;
            let labaClass = '';
            if (labaPerItem > 0) labaClass = 'laba-positif';
            else if (labaPerItem < 0) labaClass = 'laba-negatif';
            const perluStokBadge = product.perluStok ? '<span class="badge bg-success">Ya</span>' : '<span class="badge bg-secondary">Tidak</span>';
            const stokAwalDisplay = product.perluStok ? (product.stokAwal || 0) : '-';
            const stokTerjualDisplay = product.perluStok ? (product.stokTerjual || 0) : '-';
            const stokTersisaDisplay = product.perluStok ? (product.stokTersisa || 0) : '-';

            row.innerHTML = `
                <td>${product.kodeProduk}</td>
                <td>${product.namaProduk}</td>
                <td>${product.kategori}</td>
                <td>${formatRupiah(hargaModalNum)}</td>
                <td>${formatRupiah(hargaJualNum)}</td>
                <td class="${labaClass}">${formatRupiah(labaPerItem)}</td>
                <td>${perluStokBadge}</td>
                <td>${stokAwalDisplay}</td>
                <td>${stokTerjualDisplay}</td>
                <td>${stokTersisaDisplay}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${product.id}" title="Edit Produk"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${product.id}" title="Hapus Produk"><i class="bi bi-trash3"></i></button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });
        addEventListenersToButtons();
    }

    function filterAndSearchProducts(productsToFilter) {
        const searchTerm = SEARCH_INPUT.value.toLowerCase();
        const selectedCategory = FILTER_SELECT.value;
        return productsToFilter.filter(product => {
            const matchesSearch = product.kodeProduk.toLowerCase().includes(searchTerm) || product.namaProduk.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === '' || product.kategori === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }

    function resetForm() {
        PRODUCT_FORM.reset();
        INPUT_ID.value = '';
        MODAL_TITLE.innerHTML = '<i class="bi bi-box-seam me-2"></i>Tambah Produk Baru';
        INPUT_KODE_PRODUK.readOnly = false;
        INPUT_KODE_PRODUK.placeholder = 'Otomatis terisi...';
        STOK_INPUTS_DIV.style.display = 'none';
        INPUT_PERLU_STOK.checked = false;
    }

    function addProduct(newProduct) {
        products.push(newProduct);
        saveProductsData(products);
        renderProducts();
    }

    function updateProduct(updatedProduct) {
        products = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        saveProductsData(products);
        renderProducts();
    }

    function deleteProduct(id) {
        if (confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) {
            products = products.filter(product => product.id !== id);
            saveProductsData(products);
            renderProducts();
        }
    }

    PRODUCT_FORM.addEventListener('submit', function(event) {
        event.preventDefault();
        const id = INPUT_ID.value || Date.now().toString();
        const kodeProduk = INPUT_KODE_PRODUK.value.trim();
        const namaProduk = INPUT_NAMA_PRODUK.value.trim();
        const kategori = INPUT_KATEGORI.value;
        const hargaModal = parseFloat(INPUT_HARGA_MODAL.value);
        const hargaJual = parseFloat(INPUT_HARGA_JUAL.value);
        const perluStok = INPUT_PERLU_STOK.checked;
        const stokAwal = perluStok ? (parseInt(INPUT_STOK_AWAL.value) || 0) : 0;

        if (!kodeProduk || !namaProduk || !kategori || isNaN(hargaModal) || isNaN(hargaJual)) {
            alert('Mohon lengkapi semua data yang diperlukan.');
            return;
        }
        
        if (perluStok && isNaN(stokAwal)) {
            alert('Mohon isi Stok Awal jika produk memerlukan stok.');
            return;
        }

        const newProduct = { id, kodeProduk, namaProduk, kategori, hargaModal, hargaJual, perluStok, stokAwal, stokTerjual: 0, stokTersisa: stokAwal };

        if (INPUT_ID.value) {
            const existingProduct = products.find(p => p.id === id);
            if (existingProduct) {
                newProduct.stokTerjual = existingProduct.stokTerjual;
                newProduct.stokTersisa = newProduct.stokAwal - newProduct.stokTerjual;
            }
            updateProduct(newProduct);
        } else {
            addProduct(newProduct);
        }
        ADD_EDIT_MODAL.hide();
    });

    INPUT_PERLU_STOK.addEventListener('change', function() {
        STOK_INPUTS_DIV.style.display = this.checked ? 'block' : 'none';
        if (!this.checked) INPUT_STOK_AWAL.value = '';
    });

    function addEventListenersToButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => {
                const idToEdit = e.currentTarget.dataset.id;
                const productToEdit = products.find(p => p.id === idToEdit);
                if (productToEdit) {
                    MODAL_TITLE.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Produk';
                    INPUT_ID.value = productToEdit.id;
                    INPUT_KODE_PRODUK.value = productToEdit.kodeProduk;
                    INPUT_KODE_PRODUK.readOnly = true;
                    INPUT_NAMA_PRODUK.value = productToEdit.namaProduk;
                    INPUT_KATEGORI.value = productToEdit.kategori;
                    INPUT_HARGA_MODAL.value = productToEdit.hargaModal;
                    INPUT_HARGA_JUAL.value = productToEdit.hargaJual;
                    INPUT_PERLU_STOK.checked = productToEdit.perluStok;
                    STOK_INPUTS_DIV.style.display = productToEdit.perluStok ? 'block' : 'none';
                    INPUT_STOK_AWAL.value = productToEdit.perluStok ? productToEdit.stokAwal : '';
                    ADD_EDIT_MODAL.show();
                }
            };
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => { deleteProduct(e.currentTarget.dataset.id); };
        });
    }

    // Event listener untuk generator kode
    INPUT_NAMA_PRODUK.addEventListener('input', generateProductCode);
    INPUT_KATEGORI.addEventListener('change', generateProductCode);

    // Inisialisasi
    renderProducts();
    SEARCH_INPUT.addEventListener('keyup', renderProducts);
    FILTER_SELECT.addEventListener('change', renderProducts);
    document.getElementById('tambahProdukModal').addEventListener('hidden.bs.modal', resetForm);
});
