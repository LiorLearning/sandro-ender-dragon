// All variables accessed through window global

// Function to update inventory display
function updateInventoryDisplay() {
    let inventoryItems = [
        "Ender Crystal (SPACE)", 
        "Ender Pearl (SHIFT)"
    ];
    
    window.inventoryText.setText(inventoryItems.join(' | '));
}

export { updateInventoryDisplay };