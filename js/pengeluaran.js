document.addEventListener('DOMContentLoaded', function() {
    const EXPENSE_STORAGE_KEY = 'expenses';
    const TABLE_BODY = document.getElementById('dataPengeluaranTableBody');
    const EXPENSE_FORM = document.getElementById('expenseForm');
    const ADD_EXPENSE_MODAL = new bootstrap.Modal(document.getElementById('tambahPengeluaranModal'));
    const MODAL_TITLE = document.getElementById('tambahPengeluaranModalLabel');

    // Elemen Form
    const INPUT_ID = document.getElementById('editExpenseId');
    const INPUT_TANGGAL = document.getElementById('inputTanggalPengeluaran');
    const INPUT_DESKRIPSI = document.getElementById('inputDeskripsiPengeluaran');
    const INPUT_KATEGORI_MODAL = document.getElementById('inputKategoriPengeluaranModal');
    const INPUT_JUMLAH = document.getElementById('inputJumlahPengeluaran');
    const INPUT_METODE = document.getElementById('inputMetodePembayaranPengeluaran');
    const INPUT_CATATAN = document.getElementById('inputCatatanPengeluaranModal');

    // Elemen Filter
    const SEARCH_INPUT = document.getElementById('searchPengeluaran');
    const FILTER_KATEGORI = document.getElementById('filterKategoriPengeluaran');

    let expenses = [];

    function getExpensesData() {
        const storedExpenses = localStorage.getItem(EXPENSE_STORAGE_KEY);
        return storedExpenses ? JSON.parse(storedExpenses) : [];
    }

    function saveExpensesData(expensesArray) {
        localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expensesArray));
    }

    function formatRupiah(number) {
        if (isNaN(number)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }
    
    function getCategoryBadge(category) {
        const colors = {
            'Biaya Operasional': 'bg-primary',
            'Biaya Pemasaran': 'bg-info text-dark',
            'Gaji Karyawan': 'bg-success',
            'Sewa': 'bg-warning text-dark',
            'Utilitas': 'bg-secondary',
            'Lain-lain': 'bg-light text-dark'
        };
        const badgeClass = colors[category] || 'bg-dark';
        return `<span class="badge ${badgeClass}">${category}</span>`;
    }

    function renderExpenses() {
        TABLE_BODY.innerHTML = '';
        const searchTerm = SEARCH_INPUT.value.toLowerCase();
        const selectedCategory = FILTER_KATEGORI.value;
        
        const filteredExpenses = expenses.filter(expense => {
            const matchesSearch = expense.deskripsi.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === '' || expense.kategori === selectedCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

        if (filteredExpenses.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="6" class="text-center p-4">Belum ada pengeluaran yang tercatat.</td></tr>`;
            return;
        }

        filteredExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.id}</td>
                <td>${new Date(expense.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</td>
                <td>
                    <div>${expense.deskripsi}</div>
                    <small class="text-muted">${expense.catatan || ''}</small>
                </td>
                <td>${getCategoryBadge(expense.kategori)}</td>
                <td class="expense-amount">${formatRupiah(expense.jumlah)}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${expense.id}" title="Edit"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${expense.id}" title="Hapus"><i class="bi bi-trash3"></i></button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });

        addEventListenersToButtons();
    }

    function addEventListenersToButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => {
                const expenseId = e.currentTarget.dataset.id;
                const expenseToEdit = expenses.find(exp => exp.id === expenseId);
                if (expenseToEdit) {
                    MODAL_TITLE.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Pengeluaran';
                    INPUT_ID.value = expenseToEdit.id;
                    INPUT_TANGGAL.value = expenseToEdit.tanggal;
                    INPUT_DESKRIPSI.value = expenseToEdit.deskripsi;
                    INPUT_KATEGORI_MODAL.value = expenseToEdit.kategori;
                    INPUT_JUMLAH.value = expenseToEdit.jumlah;
                    INPUT_METODE.value = expenseToEdit.metodePembayaran;
                    INPUT_CATATAN.value = expenseToEdit.catatan;
                    ADD_EXPENSE_MODAL.show();
                }
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                const expenseId = e.currentTarget.dataset.id;
                if (confirm('Yakin ingin menghapus data pengeluaran ini?')) {
                    deleteExpense(expenseId);
                }
            };
        });
    }

    function deleteExpense(expenseId) {
        expenses = expenses.filter(exp => exp.id !== expenseId);
        saveExpensesData(expenses);
        renderExpenses();
    }
    
    function resetForm() {
        EXPENSE_FORM.reset();
        INPUT_ID.value = '';
        MODAL_TITLE.innerHTML = '<i class="bi bi-card-text me-2"></i>Formulir Pengeluaran';
        INPUT_TANGGAL.valueAsDate = new Date();
    }

    EXPENSE_FORM.addEventListener('submit', function(event) {
        event.preventDefault();

        const expenseId = INPUT_ID.value;
        const expenseData = {
            id: expenseId || `EXP-${Date.now()}`,
            tanggal: INPUT_TANGGAL.value,
            deskripsi: INPUT_DESKRIPSI.value.trim(),
            kategori: INPUT_KATEGORI_MODAL.value,
            jumlah: parseFloat(INPUT_JUMLAH.value),
            metodePembayaran: INPUT_METODE.value,
            catatan: INPUT_CATATAN.value.trim()
        };

        if (!expenseData.deskripsi || !expenseData.kategori || isNaN(expenseData.jumlah)) {
            alert('Mohon lengkapi Deskripsi, Kategori, dan Jumlah.');
            return;
        }

        if (expenseId) { // Edit mode
            expenses = expenses.map(exp => exp.id === expenseId ? expenseData : exp);
        } else { // Add mode
            expenses.push(expenseData);
        }

        saveExpensesData(expenses);
        renderExpenses();
        ADD_EXPENSE_MODAL.hide();
    });
    
    document.getElementById('tambahPengeluaranModal').addEventListener('hidden.bs.modal', resetForm);

    function initializePage() {
        expenses = getExpensesData();
        INPUT_TANGGAL.valueAsDate = new Date(); // Set tanggal hari ini
        renderExpenses();
        
        SEARCH_INPUT.addEventListener('keyup', renderExpenses);
        FILTER_KATEGORI.addEventListener('change', renderExpenses);
    }

    initializePage();
});
