document.addEventListener('DOMContentLoaded', function() {
    const EXPENSE_STORAGE_KEY = 'expenses';
    const TABLE_BODY = document.getElementById('dataPengeluaranTableBody');
    const EXPENSE_FORM = document.getElementById('expenseForm');
    const ADD_EDIT_MODAL = new bootstrap.Modal(document.getElementById('tambahPengeluaranModal'));
    const MODAL_TITLE = document.getElementById('tambahPengeluaranModalLabel');

    // Form inputs
    const INPUT_ID = document.getElementById('editExpenseId'); // Hidden input for editing
    const INPUT_TANGGAL_PENGELUARAN = document.getElementById('inputTanggalPengeluaran');
    const INPUT_DESKRIPSI_PENGELUARAN = document.getElementById('inputDeskripsiPengeluaran');
    const INPUT_KATEGORI_PENGELUARAN_MODAL = document.getElementById('inputKategoriPengeluaranModal');
    const INPUT_JUMLAH_PENGELUARAN = document.getElementById('inputJumlahPengeluaran');
    const INPUT_METODE_PEMBAYARAN_PENGELUARAN = document.getElementById('inputMetodePembayaranPengeluaran');
    const INPUT_CATATAN_PENGELUARAN_MODAL = document.getElementById('inputCatatanPengeluaranModal');

    // Search and filter elements
    const SEARCH_INPUT = document.getElementById('searchPengeluaran');
    const FILTER_KATEGORI_PENGELUARAN = document.getElementById('filterKategoriPengeluaran');

    let expenses = []; // Array to store expense records

    // --- Utility Functions ---
    function getExpensesFromLocalStorage() {
        const storedExpenses = localStorage.getItem(EXPENSE_STORAGE_KEY);
        return storedExpenses ? JSON.parse(storedExpenses) : [];
    }

    function saveExpensesToLocalStorage(expensesArray) {
        localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expensesArray));
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
        // Ensure the date is parsed as local date to avoid timezone issues
        // If input is "YYYY-MM-DD", it's usually interpreted as UTC by default,
        // which can shift the date back by a day in local time.
        // A common workaround is to parse it as new Date(dateString + 'T00:00:00')
        // or just use toLocaleDateString which often handles it correctly
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // --- Render Expenses to Table ---
    function renderExpenses() {
        TABLE_BODY.innerHTML = ''; // Clear existing rows
        const filteredExpenses = filterAndSearchExpenses(expenses);

        if (filteredExpenses.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="8" class="text-center">Tidak ada catatan pengeluaran ditemukan.</td></tr>`;
            return;
        }

        filteredExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.idPengeluaran}</td>
                <td>${formatDate(expense.tanggal)}</td>
                <td>${expense.deskripsi}</td>
                <td>${expense.kategori}</td>
                <td>${formatRupiah(expense.jumlah)}</td>
                <td>${expense.metodePembayaran}</td>
                <td>${expense.catatan || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1 edit-btn" data-id="${expense.idPengeluaran}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${expense.idPengeluaran}">Hapus</button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });

        addEventListenersToButtons();
    }

    // --- Search and Filter Logic ---
    function filterAndSearchExpenses(expensesToFilter) {
        const searchTerm = SEARCH_INPUT.value.toLowerCase();
        const selectedCategory = FILTER_KATEGORI_PENGELUARAN.value.toLowerCase();

        return expensesToFilter.filter(expense => {
            const matchesSearch = expense.deskripsi.toLowerCase().includes(searchTerm) ||
                                  expense.idPengeluaran.toLowerCase().includes(searchTerm) ||
                                  (expense.catatan && expense.catatan.toLowerCase().includes(searchTerm)); // Check if catatan exists

            const matchesCategory = selectedCategory === '' || expense.kategori.toLowerCase() === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }

    // --- Add/Edit Expense Functions ---
    function resetForm() {
        EXPENSE_FORM.reset();
        INPUT_ID.value = '';
        MODAL_TITLE.textContent = 'Catat Pengeluaran Baru';
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        INPUT_TANGGAL_PENGELUARAN.value = today;
    }

    function addExpense(newExpense) {
        expenses.push(newExpense);
        saveExpensesToLocalStorage(expenses);
        renderExpenses();
    }

    function updateExpense(updatedExpense) {
        expenses = expenses.map(e => e.idPengeluaran === updatedExpense.idPengeluaran ? updatedExpense : e);
        saveExpensesToLocalStorage(expenses);
        renderExpenses();
    }

    function deleteExpense(id) {
        if (confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran ini?')) {
            expenses = expenses.filter(expense => expense.idPengeluaran !== id);
            saveExpensesToLocalStorage(expenses);
            renderExpenses();
        }
    }

    // --- Event Listeners ---
    EXPENSE_FORM.addEventListener('submit', function(event) {
        event.preventDefault();

        const idPengeluaran = INPUT_ID.value || `EXP-${Date.now()}`; // Generate unique ID
        const tanggal = INPUT_TANGGAL_PENGELUARAN.value;
        const deskripsi = INPUT_DESKRIPSI_PENGELUARAN.value.trim();
        const kategori = INPUT_KATEGORI_PENGELUARAN_MODAL.value;
        const jumlah = parseFloat(INPUT_JUMLAH_PENGELUARAN.value);
        const metodePembayaran = INPUT_METODE_PEMBAYARAN_PENGELUARAN.value;
        const catatan = INPUT_CATATAN_PENGELUARAN_MODAL.value.trim();

        // Basic validation
        if (!tanggal || !deskripsi || !kategori || isNaN(jumlah) || jumlah <= 0 || !metodePembayaran) {
            alert('Mohon lengkapi semua data yang diperlukan dan pastikan jumlah lebih dari 0.');
            return;
        }

        const newExpense = {
            idPengeluaran: idPengeluaran,
            tanggal: tanggal,
            deskripsi: deskripsi,
            kategori: kategori,
            jumlah: jumlah,
            metodePembayaran: metodePembayaran,
            catatan: catatan
        };

        if (INPUT_ID.value) {
            updateExpense(newExpense);
        } else {
            addExpense(newExpense);
        }

        ADD_EDIT_MODAL.hide();
        resetForm();
    });

    function addEventListenersToButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => {
                const idToEdit = e.target.dataset.id;
                const expenseToEdit = expenses.find(exp => exp.idPengeluaran === idToEdit);

                if (expenseToEdit) {
                    MODAL_TITLE.textContent = 'Edit Pengeluaran';
                    INPUT_ID.value = expenseToEdit.idPengeluaran;
                    INPUT_TANGGAL_PENGELUARAN.value = expenseToEdit.tanggal; // Assuming format is YYYY-MM-DD
                    INPUT_DESKRIPSI_PENGELUARAN.value = expenseToEdit.deskripsi;
                    INPUT_KATEGORI_PENGELUARAN_MODAL.value = expenseToEdit.kategori;
                    INPUT_JUMLAH_PENGELUARAN.value = expenseToEdit.jumlah;
                    INPUT_METODE_PEMBAYARAN_PENGELUARAN.value = expenseToEdit.metodePembayaran;
                    INPUT_CATATAN_PENGELUARAN_MODAL.value = expenseToEdit.catatan;

                    ADD_EDIT_MODAL.show();
                }
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                deleteExpense(e.target.dataset.id);
            };
        });
    }

    // Initialize data and render on page load
    expenses = getExpensesFromLocalStorage();
    renderExpenses();

    // Set default date for new expense on initial load
    const today = new Date().toISOString().split('T')[0];
    INPUT_TANGGAL_PENGELUARAN.value = today;

    // Event listeners for search and filter
    SEARCH_INPUT.addEventListener('keyup', renderExpenses);
    FILTER_KATEGORI_PENGELUARAN.addEventListener('change', renderExpenses);

    // Reset form when modal is hidden
    document.getElementById('tambahPengeluaranModal').addEventListener('hidden.bs.modal', resetForm);
});
