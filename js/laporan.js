document.addEventListener('DOMContentLoaded', function() {
    const SALES_STORAGE_KEY = 'sales';
    const EXPENSE_STORAGE_KEY = 'expenses';

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const generateReportBtn = document.getElementById('generateReport');
    // --- TOMBOL BARU ---
    const downloadFilteredBtn = document.getElementById('downloadFilteredBtn'); 
    const downloadLastMonthBtn = document.getElementById('downloadLastMonthBtn');

    const totalPendapatanEl = document.getElementById('totalPendapatan');
    const totalPengeluaranEl = document.getElementById('totalPengeluaran');
    const totalLabaKotorEl = document.getElementById('totalLabaKotor');
    const totalLabaBersihEl = document.getElementById('totalLabaBersih');

    const salesTableBody = document.getElementById('reportSalesTableBody');
    const expensesTableBody = document.getElementById('reportExpensesTableBody');

    function getSalesData() { return JSON.parse(localStorage.getItem(SALES_STORAGE_KEY) || '[]'); }
    function getExpensesData() { return JSON.parse(localStorage.getItem(EXPENSE_STORAGE_KEY) || '[]'); }

    function formatRupiah(number) {
        if (isNaN(number)) number = 0;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }
    
    function formatDate(dateString, forFileName = false) {
        const date = new Date(dateString + 'T00:00:00');
        if (forFileName) {
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        }
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function generateReport(startDate, endDate) {
        const sales = getSalesData();
        const expenses = getExpensesData();
        
        const filteredSales = sales.filter(s => {
            const saleDate = new Date(s.tanggal + 'T00:00:00');
            return saleDate >= startDate && saleDate <= endDate;
        });
        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.tanggal + 'T00:00:00');
            return expenseDate >= startDate && expenseDate <= endDate;
        });

        const totalPendapatan = filteredSales.reduce((sum, s) => sum + s.totalHargaJual, 0);
        const totalPengeluaran = filteredExpenses.reduce((sum, e) => sum + e.jumlah, 0);
        const totalLabaKotor = filteredSales.reduce((sum, s) => sum + s.labaBersih, 0);
        const totalLabaBersih = totalLabaKotor - totalPengeluaran;

        totalPendapatanEl.textContent = formatRupiah(totalPendapatan);
        totalPengeluaranEl.textContent = formatRupiah(totalPengeluaran);
        totalLabaKotorEl.textContent = formatRupiah(totalLabaKotor);
        totalLabaBersihEl.textContent = formatRupiah(totalLabaBersih);

        renderSalesDetailTable(filteredSales);
        renderExpensesDetailTable(filteredExpenses);
    }

    function renderSalesDetailTable(sales) {
        salesTableBody.innerHTML = sales.length === 0 ? `<tr><td colspan="5" class="text-center text-muted">Tidak ada penjualan pada periode ini.</td></tr>` : sales.map(s => `<tr><td>${formatDate(s.tanggal)}</td><td>${s.namaProduk}</td><td>${s.jumlah}</td><td>${formatRupiah(s.totalHargaJual)}</td><td class="${s.labaBersih >= 0 ? 'text-success' : 'text-danger'}">${formatRupiah(s.labaBersih)}</td></tr>`).join('');
    }

    function renderExpensesDetailTable(expenses) {
        expensesTableBody.innerHTML = expenses.length === 0 ? `<tr><td colspan="4" class="text-center text-muted">Tidak ada pengeluaran pada periode ini.</td></tr>` : expenses.map(e => `<tr><td>${formatDate(e.tanggal)}</td><td>${e.deskripsi}</td><td><span class="badge bg-secondary">${e.kategori}</span></td><td class="text-danger">${formatRupiah(e.jumlah)}</td></tr>`).join('');
    }

    // --- FUNGSI BARU (REUSABLE): UNTUK MEMBUAT DAN DOWNLOAD FILE EXCEL ---
    function createAndDownloadExcel(salesData, expensesData, fileName) {
        const totalPendapatan = salesData.reduce((sum, s) => sum + s.totalHargaJual, 0);
        const totalPengeluaran = expensesData.reduce((sum, e) => sum + e.jumlah, 0);
        const totalLabaKotor = salesData.reduce((sum, s) => sum + s.labaBersih, 0);
        const totalLabaBersih = totalLabaKotor - totalPengeluaran;

        const summaryData = [
            { Indikator: "Total Pendapatan", Jumlah: totalPendapatan },
            { Indikator: "Total Pengeluaran", Jumlah: totalPengeluaran },
            { Indikator: "Total Laba Kotor (dari Penjualan)", Jumlah: totalLabaKotor },
            { Indikator: "Laba Bersih Final", Jumlah: totalLabaBersih }
        ];

        const salesDataForExcel = salesData.map(s => ({
            Tanggal: formatDate(s.tanggal), ID_Transaksi: s.id, Nama_Produk: s.namaProduk,
            Jumlah_Item: s.jumlah, Total_Harga_Jual: s.totalHargaJual, Laba_Bersih: s.labaBersih
        }));

        const expensesDataForExcel = expensesData.map(e => ({
            Tanggal: formatDate(e.tanggal), Deskripsi: e.deskripsi, Kategori: e.kategori,
            Jumlah_Pengeluaran: e.jumlah, Metode_Pembayaran: e.metodePembayaran, Catatan: e.catatan
        }));

        const wb = XLSX.utils.book_new();
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['B2'].z = wsSummary['B3'].z = wsSummary['B4'].z = wsSummary['B5'].z = '"Rp"#,##0;("Rp"#,##0)';
        wsSummary['!cols'] = [ {wch:35}, {wch:20} ];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

        if (salesDataForExcel.length > 0) {
            const wsSales = XLSX.utils.json_to_sheet(salesDataForExcel);
            wsSales['!cols'] = [ {wch:12}, {wch:18}, {wch:30}, {wch:12}, {wch:18}, {wch:18} ];
            XLSX.utils.book_append_sheet(wb, wsSales, "Detail Penjualan");
        }
        
        if (expensesDataForExcel.length > 0) {
            const wsExpenses = XLSX.utils.json_to_sheet(expensesDataForExcel);
            wsExpenses['!cols'] = [ {wch:12}, {wch:30}, {wch:20}, {wch:18}, {wch:18}, {wch:30} ];
            XLSX.utils.book_append_sheet(wb, wsExpenses, "Detail Pengeluaran");
        }
        
        XLSX.writeFile(wb, fileName);
    }
    
    // --- Event Listeners ---
    generateReportBtn.addEventListener('click', () => {
        const startDate = new Date(startDateInput.value + 'T00:00:00');
        const endDate = new Date(endDateInput.value + 'T00:00:00');
        endDate.setHours(23, 59, 59, 999);
        if (!startDateInput.value || !endDateInput.value) {
            alert("Silakan pilih tanggal mulai dan tanggal akhir.");
            return;
        }
        generateReport(startDate, endDate);
    });

    // Event listener untuk download rekap bulan lalu (tetap seperti semula)
    downloadLastMonthBtn.addEventListener('click', () => {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const year = lastMonth.getFullYear();
        const month = lastMonth.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        const sales = getSalesData().filter(s => new Date(s.tanggal + 'T00:00:00') >= startDate && new Date(s.tanggal + 'T00:00:00') <= endDate);
        const expenses = getExpensesData().filter(e => new Date(e.tanggal + 'T00:00:00') >= startDate && new Date(e.tanggal + 'T00:00:00') <= endDate);
        
        const monthName = lastMonth.toLocaleString('id-ID', { month: 'long' });
        const fileName = `Laporan Keuangan - ${monthName} ${year}.xlsx`;
        
        createAndDownloadExcel(sales, expenses, fileName);
    });

    // Event listener untuk tombol download BARU
    downloadFilteredBtn.addEventListener('click', () => {
        const startDateValue = startDateInput.value;
        const endDateValue = endDateInput.value;

        if (!startDateValue || !endDateValue) {
            alert("Silakan pilih tanggal di filter terlebih dahulu sebelum men-download.");
            return;
        }

        const startDate = new Date(startDateValue + 'T00:00:00');
        const endDate = new Date(endDateValue + 'T00:00:00');
        endDate.setHours(23, 59, 59, 999);

        const sales = getSalesData().filter(s => new Date(s.tanggal + 'T00:00:00') >= startDate && new Date(s.tanggal + 'T00:00:00') <= endDate);
        const expenses = getExpensesData().filter(e => new Date(e.tanggal + 'T00:00:00') >= startDate && new Date(e.tanggal + 'T00:00:00') <= endDate);
        
        const fileName = `Laporan ${formatDate(startDateValue, true)} - ${formatDate(endDateValue, true)}.xlsx`;
        
        createAndDownloadExcel(sales, expenses, fileName);
    });

    // --- Inisialisasi Halaman ---
    function initializePage() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        startDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0]; // Default sampai hari ini
        
        generateReport(firstDayOfMonth, today);
    }

    initializePage();
});
