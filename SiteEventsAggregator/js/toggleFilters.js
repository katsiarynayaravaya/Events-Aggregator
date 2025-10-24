document.addEventListener('DOMContentLoaded', () => {
    const filterBlocks = document.querySelectorAll('.filter-block');
    const expandAllBtn = document.getElementById('expandAll');
    const collapseAllBtn = document.getElementById('collapseAll');
    const resetAllBtn = document.getElementById('resetAll');

    filterBlocks.forEach(block => {
        const header = block.querySelector('.filter-header');
        const resetLink = block.querySelector('.reset-link');
        const checkboxes = block.querySelectorAll('input[type="checkbox"]');

        header.addEventListener('click', (e) => {
            if (e.target.classList.contains('reset-link')) return;
            block.classList.toggle('active');
            updateGlobalButtons();
        });

        resetLink.addEventListener('click', (e) => {
            e.stopPropagation();
            checkboxes.forEach(ch => ch.checked = false);
            resetLink.style.display = 'none';
        });

        checkboxes.forEach(ch => {
            ch.addEventListener('change', () => {
                const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
                resetLink.style.display = anyChecked ? 'inline' : 'none';
            });
        });
    });

    expandAllBtn.addEventListener('click', () => {
        filterBlocks.forEach(b => b.classList.add('active'));
        updateGlobalButtons();
    });

    collapseAllBtn.addEventListener('click', () => {
        filterBlocks.forEach(b => b.classList.remove('active'));
        updateGlobalButtons();
    });

    resetAllBtn.addEventListener('click', () => {
        filterBlocks.forEach(block => {
            const resetLink = block.querySelector('.reset-link');
            const checkboxes = block.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(ch => ch.checked = false);
            resetLink.style.display = 'none';
        });
    });

    function updateGlobalButtons() {
        const allExpanded = Array.from(filterBlocks).every(b => b.classList.contains('active'));
        const allCollapsed = Array.from(filterBlocks).every(b => !b.classList.contains('active'));

        if (allExpanded) {
            expandAllBtn.style.display = 'none';
            collapseAllBtn.style.display = 'inline';
        } else if (allCollapsed) {
            collapseAllBtn.style.display = 'none';
            expandAllBtn.style.display = 'inline';
        } else {
            expandAllBtn.style.display = 'inline';
            collapseAllBtn.style.display = 'inline';
        }
    }

    updateGlobalButtons();
});

