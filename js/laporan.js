document.addEventListener('DOMContentLoaded', function() {
    // Re-declare utility functions (or ensure they are globally available from other scripts)
    // For simplicity, we'll re-declare local storage getters here.
    // In a real app, you might refactor these into a single utility file.

    // Assumes these functions are available globally from script.js, penjualan.js, pengeluaran.js
    // If not, you'd copy them here or ensure proper script loading order.
    function getProductsFromLocalStorage() { // From script.js, now global getProductsData()
        return typeof getProductsData === 'function' ? getProductsData() : [];
    }

    function getSalesFromLocalStorage() { // From penjualan.js
        const storedSales = localStorage.getItem('sales');
        return storedSales ? JSON.parse(storedSales) : [];
    }

    function getExpensesFromLocalStorage() { // From pengeluaran.js
        const storedExpenses = localStorage.getItem('expenses');
        return storedExpenses ? JSON.parse(storedExpenses) : [];
    }

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

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const generateReportButton = document.getElementById('generateReport');

    const totalPendapatanElement = document.getElementById('totalPendapatan');
    const totalPengeluaranElement = document.getElementById('totalPengeluaran');
    const totalLabaBersihElement = document.getElementById('totalLabaBersih');
    const totalLabaKotorPenjualanElement = document.getElementById('totalLabaKotorPenjualan');

    const reportSalesTableBody = document.getElementById('reportSalesTableBody');
    const reportExpensesTableBody = document.getElementById('reportExpensesTableBody');

    // Set default filter dates (e.g., last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];

    function generateReport() {
        const startDate = startDateInput.value ? new Date(startDateInput.value + 'T00:00:00') : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null; // End of day

        const allSales = getSalesFromLocalStorage();
        const allExpenses = getExpensesFromLocalStorage();

        let filteredSales = allSales;
        let filteredExpenses = allExpenses;

        if (startDate && endDate) {
            filteredSales = allSales.filter(sale => {
                const saleDate = new Date(sale.tanggal + 'T00:00:00'); // Ensure consistent date parsing
                return saleDate >= startDate && saleDate <= endDate;
            });

            filteredExpenses = allExpenses.filter(expense => {
                const expenseDate = new Date(expense.tanggal + 'T00:00:00'); // Ensure consistent date parsing
                return expenseDate >= startDate && expenseDate <= endDate;
            });
        }

        // --- Calculate Summary ---
        let totalPendapatanBruto = 0; // Total Harga Jual dari semua penjualan
        let totalLabaKotor = 0; // Total Laba Bersih dari semua penjualan
        let totalPengeluaran = 0; // Total Jumlah dari semua pengeluaran

        filteredSales.forEach(sale => {
            totalPendapatanBruto += sale.totalHargaJual || 0;
            totalLabaKotor += sale.labaBersih || 0;
        });

        filteredExpenses.forEach(expense => {
            totalPengeluaran += expense.jumlah || 0;
        });

        const labaBersihKeseluruhan = totalLabaKotor - totalPengeluaran;

        totalPendapatanElement.textContent = formatRupiah(totalPendapatanBruto);
        totalLabaKotorPenjualanElement.textContent = formatRupiah(totalLabaKotor);
        totalPengeluaranElement.textContent = formatRupiah(totalPengeluaran);
        totalLabaBersihElement.textContent = formatRupiah(labaBersihKeseluruhan);

        // --- Render Sales Detail Table ---
        reportSalesTableBody.innerHTML = '';
        if (filteredSales.length === 0) {
            reportSalesTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Tidak ada data penjualan dalam periode ini.</td></tr>`;
        } else {
            filteredSales.forEach(sale => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${sale.idTransaksi}</td>
                    <td>${formatDate(sale.tanggal)}</td>
                    <td>${sale.namaProduk}</td>
                    <td>${sale.jumlah}</td>
                    <td>${formatRupiah(sale.totalHargaJual)}</td>
                    <td>${formatRupiah(sale.labaBersih)}</td>
                `;
                reportSalesTableBody.appendChild(row);
            });
        }

        // --- Render Expenses Detail Table ---
        reportExpensesTableBody.innerHTML = '';
        if (filteredExpenses.length === 0) {
            reportExpensesTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Tidak ada data pengeluaran dalam periode ini.</td></tr>`;
        } else {
            filteredExpenses.forEach(expense => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${expense.idPengeluaran}</td>
                    <td>${formatDate(expense.tanggal)}</td>
                    <td>${expense.deskripsi}</td>
                    <td>${expense.kategori}</td>
                    <td>${formatRupiah(expense.jumlah)}</td>
                `;
                reportExpensesTableBody.appendChild(row);
            });
        }
    }

    // Event listener for generating report
    generateReportButton.addEventListener('click', generateReport);

    // Generate report on initial page load
    generateReport();
});
