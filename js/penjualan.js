document.addEventListener('DOMContentLoaded', function() {
    // Pastikan DOM sudah siap sebelum menjalankan skrip
    if (typeof getProductsData === 'undefined') {
        console.error('PENTING: Pastikan file script.js sudah dimuat sebelum penjualan.js');
        return;
    }

    const SALES_STORAGE_KEY = 'sales';
    const TABLE_BODY = document.getElementById('dataPenjualanTableBody');
    const SALES_FORM = document.getElementById('salesForm');
    const ADD_SALE_MODAL = new bootstrap.Modal(document.getElementById('tambahPenjualanModal'));
    
    // Elemen Form
    const SELECT_PRODUK = document.getElementById('inputProdukPenjualan');
    const INPUT_TANGGAL = document.getElementById('inputTanggalPenjualan');
    const INPUT_JUMLAH = document.getElementById('inputJumlahPenjualan');
    const INPUT_METODE = document.getElementById('inputMetodePembayaran');
    const INPUT_CATATAN = document.getElementById('inputCatatanPenjualan');
    const STOK_INFO = document.getElementById('stokInfo');
    const INFO_HARGA_JUAL = document.getElementById('infoHargaJual');
    const INFO_LABA_BERSIH = document.getElementById('infoLabaBersih');
    const SEARCH_INPUT = document.getElementById('searchPenjualan');


    let products = [];
    let sales = [];

    // Fungsi helper untuk data penjualan
    function getSalesData() {
        const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
        return storedSales ? JSON.parse(storedSales) : [];
    }

    function saveSalesData(salesArray) {
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesArray));
    }

    function formatRupiah(number) {
        if (isNaN(number)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }
    
    function populateProductsDropdown() {
        SELECT_PRODUK.innerHTML = '<option value="" disabled selected>Pilih Produk...</option>';
        products.forEach(product => {
            const stokText = product.perluStok ? `(Sisa: ${product.stokTersisa})` : '';
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.namaProduk} ${stokText}`;
            option.dataset.hargaJual = product.hargaJual;
            option.dataset.hargaModal = product.hargaModal;
            option.dataset.perluStok = product.perluStok;
            option.dataset.stokTersisa = product.stokTersisa;
            
            if(product.perluStok && product.stokTersisa <= 0) {
                option.disabled = true;
            }
            
            SELECT_PRODUK.appendChild(option);
        });
    }

    function calculateTotals() {
        const selectedOption = SELECT_PRODUK.options[SELECT_PRODUK.selectedIndex];
        if (!selectedOption || !selectedOption.value) {
            STOK_INFO.textContent = '';
            INFO_HARGA_JUAL.textContent = formatRupiah(0);
            INFO_LABA_BERSIH.textContent = formatRupiah(0);
            return;
        }

        const hargaJual = parseFloat(selectedOption.dataset.hargaJual) || 0;
        const hargaModal = parseFloat(selectedOption.dataset.hargaModal) || 0;
        const jumlah = parseInt(INPUT_JUMLAH.value) || 0;
        const perluStok = selectedOption.dataset.perluStok === 'true';
        const stokTersisa = parseInt(selectedOption.dataset.stokTersisa) || 0;
        
        if(perluStok) {
            INPUT_JUMLAH.max = stokTersisa;
            STOK_INFO.textContent = `Stok tersedia: ${stokTersisa}.`;
            STOK_INFO.style.color = stokTersisa > 0 ? 'green' : 'red';
        } else {
            INPUT_JUMLAH.removeAttribute('max');
            STOK_INFO.textContent = 'Produk ini tidak menggunakan stok.';
            STOK_INFO.style.color = 'grey';
        }


        const totalHargaJual = hargaJual * jumlah;
        const labaBersih = (hargaJual - hargaModal) * jumlah;

        INFO_HARGA_JUAL.textContent = formatRupiah(totalHargaJual);
        INFO_LABA_BERSIH.textContent = formatRupiah(labaBersih);
        INFO_LABA_BERSIH.className = labaBersih >= 0 ? 'laba-positif' : 'laba-negatif';
    }

    function renderSales() {
        TABLE_BODY.innerHTML = '';
        const searchTerm = SEARCH_INPUT.value.toLowerCase();

        const filteredSales = sales.filter(sale => {
            return sale.id.toLowerCase().includes(searchTerm) ||
                   sale.namaProduk.toLowerCase().includes(searchTerm) ||
                   sale.kodeProduk.toLowerCase().includes(searchTerm) ||
                   sale.metodePembayaran.toLowerCase().includes(searchTerm);
        }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Urutkan dari terbaru

        if (filteredSales.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="8" class="text-center p-4">Belum ada penjualan yang tercatat.</td></tr>`;
            return;
        }

        filteredSales.forEach(sale => {
            const row = document.createElement('tr');
            const labaClass = sale.labaBersih >= 0 ? 'laba-positif' : 'laba-negatif';
            row.innerHTML = `
                <td>${sale.id}</td>
                <td>${new Date(sale.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</td>
                <td>${sale.namaProduk}</td>
                <td>${sale.jumlah}</td>
                <td>${formatRupiah(sale.totalHargaJual)}</td>
                <td class="${labaClass}">${formatRupiah(sale.labaBersih)}</td>
                <td><span class="badge bg-info text-dark">${sale.metodePembayaran}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${sale.id}" title="Hapus Penjualan"><i class="bi bi-trash3"></i></button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });

        addEventListenersToButtons();
    }
    
    function addEventListenersToButtons() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                const saleId = e.currentTarget.dataset.id;
                if (confirm('Yakin ingin menghapus penjualan ini? Stok produk akan dikembalikan.')) {
                    deleteSale(saleId);
                }
            };
        });
    }

    function deleteSale(saleId) {
        const saleToDelete = sales.find(s => s.id === saleId);
        if (!saleToDelete) return;

        // Kembalikan stok produk jika perlu
        const productToUpdate = products.find(p => p.id === saleToDelete.productId);
        if (productToUpdate && productToUpdate.perluStok) {
            productToUpdate.stokTerjual -= saleToDelete.jumlah;
            productToUpdate.stokTersisa += saleToDelete.jumlah;
            saveProductsData(products); // Simpan perubahan data produk
        }

        // Hapus penjualan
        sales = sales.filter(s => s.id !== saleId);
        saveSalesData(sales);
        renderSales();
    }


    SALES_FORM.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const selectedOption = SELECT_PRODUK.options[SELECT_PRODUK.selectedIndex];
        if (!selectedOption.value) {
            alert('Silakan pilih produk terlebih dahulu.');
            return;
        }

        const productId = selectedOption.value;
        const product = products.find(p => p.id === productId);
        const jumlah = parseInt(INPUT_JUMLAH.value);
        
        if (product.perluStok && jumlah > product.stokTersisa) {
            alert(`Stok tidak mencukupi! Sisa stok untuk ${product.namaProduk} hanya ${product.stokTersisa}.`);
            return;
        }

        // Buat data penjualan baru
        const totalHargaJual = (parseFloat(product.hargaJual) || 0) * jumlah;
        const labaBersih = ( (parseFloat(product.hargaJual) || 0) - (parseFloat(product.hargaModal) || 0) ) * jumlah;
        
        const newSale = {
            id: `TXN-${Date.now()}`,
            productId: product.id,
            namaProduk: product.namaProduk,
            kodeProduk: product.kodeProduk,
            tanggal: INPUT_TANGGAL.value,
            jumlah: jumlah,
            hargaJualSatuan: product.hargaJual,
            totalHargaJual: totalHargaJual,
            labaBersih: labaBersih,
            metodePembayaran: INPUT_METODE.value,
            catatan: INPUT_CATATAN.value.trim()
        };

        // Kurangi stok produk jika perlu
        if (product.perluStok) {
            product.stokTerjual += jumlah;
            product.stokTersisa -= jumlah;
            saveProductsData(products);
        }

        sales.push(newSale);
        saveSalesData(sales);
        
        ADD_SALE_MODAL.hide();
        renderSales();
    });
    
    // Reset form saat modal ditutup
    document.getElementById('tambahPenjualanModal').addEventListener('hidden.bs.modal', function() {
        SALES_FORM.reset();
        INPUT_TANGGAL.valueAsDate = new Date(); // Set tanggal hari ini
        calculateTotals(); // Reset info kalkulasi
    });

    function initializePage() {
        products = getProductsData();
        sales = getSalesData();
        
        populateProductsDropdown();
        INPUT_TANGGAL.valueAsDate = new Date(); // Set tanggal hari ini saat form dibuka
        calculateTotals();
        renderSales();
        
        SELECT_PRODUK.addEventListener('change', calculateTotals);
        INPUT_JUMLAH.addEventListener('input', calculateTotals);
        SEARCH_INPUT.addEventListener('keyup', renderSales);
    }

    initializePage();
});
