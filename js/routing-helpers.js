/**
 * Helper functions for pipe routing calculations
 */

// Get base stats based on vehicle type
function getVehicleBaseStats(vehicleType) {
    const baseStats = {
        'sedan': {
            length: 3.2,
            bends: 10,
            clearance: 4.2,
            score: 75
        },
        'suv': {
            length: 3.8,
            bends: 12,
            clearance: 6.0,
            score: 72
        },
        'sports': {
            length: 2.8,
            bends: 8,
            clearance: 3.5,
            score: 78
        }
    };
    return baseStats[vehicleType] || baseStats['sedan'];
}

// Get modifiers based on pipe type
function getPipeTypeModifiers(pipeType) {
    const modifiers = {
        'fuel': {
            length: 1.0,
            bends: 1.0,
            clearance: 1.0,
            score: 0
        },
        'cooling': {
            length: 1.2,
            bends: 1.1,
            clearance: 1.15,
            score: -2
        },
        'brake': {
            length: 0.9,
            bends: 0.8,
            clearance: 1.1,
            score: 2
        }
    };
    return modifiers[pipeType] || modifiers['fuel'];
}

// Calculate impact of optimizations
function calculateOptimizationImpact(optimizations, vehicleType, pipeType) {
    let impact = {
        length: 1.0,
        bends: 1.0,
        clearance: 1.0,
        score: 0
    };

    // Minimize length optimization
    if (optimizations.minimizeLength) {
        impact.length *= 0.7;
        impact.score += (vehicleType === 'sports' ? 8 : 5);
        
        // Additional vehicle-specific adjustments
        if (vehicleType === 'sports') {
            impact.clearance *= 0.9; // Reduced clearance for shorter paths
        }
    }

    // Minimize bends optimization
    if (optimizations.minimizeBends) {
        impact.bends *= 0.6;
        impact.score += (vehicleType === 'sports' ? 7 : 5);
        
        // Pipe-specific adjustments
        if (pipeType === 'cooling') {
            impact.length *= 1.1; // Slightly longer to maintain smoother bends
        }
    }

    // Maximize clearance optimization
    if (optimizations.maximizeClearance) {
        impact.clearance *= 1.4;
        impact.length *= 1.15; // Longer paths for better clearance
        impact.score += (vehicleType === 'suv' ? 7 : 5);
    }

    // Heat avoidance optimization
    if (optimizations.avoidHeat) {
        if (pipeType === 'fuel' || pipeType === 'cooling') {
            impact.clearance *= 1.2;
            impact.length *= 1.1;
            impact.score += 8;
        } else {
            impact.score += 5;
        }
    }

    return impact;
}

// Export functions
window.routingHelpers = {
    getVehicleBaseStats,
    getPipeTypeModifiers,
    calculateOptimizationImpact
};
