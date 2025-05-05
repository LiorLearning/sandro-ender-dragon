// All variables accessed through window global

// Function to create minimap
function createMinimap() {
    // Create a container for the minimap in the bottom left corner
    const minimapWidth = 200;
    const minimapHeight = 150;
    const padding = 10;
    
    // Background for minimap
    const minimapBackground = this.add.rectangle(
        padding, 
        window.innerHeight - minimapHeight - padding, 
        minimapWidth, 
        minimapHeight, 
        0x000000, 
        0.7
    ).setScrollFactor(0)
     .setOrigin(0, 0)
     .setDepth(90);
    
    // Create the minimap container
    window.minimap = this.add.container(
        padding + minimapWidth / 2, 
        window.innerHeight - minimapHeight - padding + minimapHeight / 2
    ).setScrollFactor(0)
     .setDepth(91);
    
    // Add border
    const minimapBorder = this.add.rectangle(
        0, 
        0, 
        minimapWidth, 
        minimapHeight, 
        0xffffff, 
        0
    ).setStrokeStyle(2, 0xffffff);
    
    window.minimap.add(minimapBorder);
    
    // Add labels
    const minimapLabel = this.add.text(
        0, 
        -minimapHeight/2 + 10, 
        "MINIMAP", 
        { 
            fontSize: '12px', 
            fontFamily: 'Arial', 
            fill: '#ffffff' 
        }
    ).setOrigin(0.5, 0);
    
    window.minimap.add(minimapLabel);
    
    // Create and add entities to the minimap
    
    // Player marker (white circle)
    const playerMarker = this.add.circle(0, 0, 4, 0xffffff);
    window.minimap.add(playerMarker);
    window.minimapEntities.push({ gameObject: window.player, marker: playerMarker, type: 'player' });
    
    // Dragon marker (red triangle)
    const dragonMarker = this.add.triangle(0, 0, 0, -5, 5, 5, -5, 5, 0xff0000);
    window.minimap.add(dragonMarker);
    window.minimapEntities.push({ gameObject: window.dragon, marker: dragonMarker, type: 'dragon' });
    
    // Tower markers (blue rectangles)
    window.towers.forEach(tower => {
        const towerMarker = this.add.rectangle(0, 0, 3, 5, 0x0000ff);
        window.minimap.add(towerMarker);
        window.minimapEntities.push({ gameObject: tower, marker: towerMarker, type: 'tower' });
    });
    
    // Update minimap on the first frame
    updateMinimap.call(this);
}

// Function to update minimap
function updateMinimap() {
    if (!window.minimap) return;
    
    const minimapScale = 0.02; // Scale factor for converting world coordinates to minimap coordinates
    
    // Update each entity on the minimap
    window.minimapEntities.forEach(entity => {
        if (!entity.gameObject.active) {
            // If game object is inactive, hide its marker
            entity.marker.setVisible(false);
            return;
        }
        
        entity.marker.setVisible(true);
        
        // Calculate position on minimap
        const x = (entity.gameObject.x - this.cameras.main.worldView.x) * minimapScale;
        const y = (entity.gameObject.y - this.cameras.main.worldView.y) * minimapScale;
        
        // Clamp position to minimap boundaries
        const clampedX = Phaser.Math.Clamp(x, -90, 90);
        const clampedY = Phaser.Math.Clamp(y, -70, 70);
        
        entity.marker.setPosition(clampedX, clampedY);
    });
}

export { createMinimap, updateMinimap };