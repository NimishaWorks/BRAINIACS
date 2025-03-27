// Function to generate AI recommendations for routes
function generateRouteRecommendations(route1, route2) {
    const recommendations = {
        route1: [],
        route2: [],
        comparison: []
    };

    // Compare key metrics
    const lengthDiff = (parseFloat(route2.stats.length) - parseFloat(route1.stats.length)).toFixed(1);
    const bendsDiff = route2.stats.bends - route1.stats.bends;
    const clearanceDiff = (parseFloat(route2.stats.clearance) - parseFloat(route1.stats.clearance)).toFixed(1);
    const scoreDiff = route2.stats.score - route1.stats.score;

    // Route 1 specific recommendations
    if (route1.stats.score > route2.stats.score) {
        recommendations.route1.push("Primary recommended route with better overall performance metrics");
    }
    if (parseFloat(route1.stats.length) < parseFloat(route2.stats.length)) {
        recommendations.route1.push(`Shorter path length saves ${Math.abs(lengthDiff)}m of material`);
    }
    if (route1.stats.bends < route2.stats.bends) {
        recommendations.route1.push(`Fewer bends (${Math.abs(bendsDiff)} less) improves flow characteristics`);
    }

    // Route 2 specific recommendations with enhanced distinctions
    if (route2.stats.score > route1.stats.score) {
        recommendations.route2.push(`Superior performance route with ${scoreDiff} points higher rating`);
    }
    if (parseFloat(route2.stats.clearance) > parseFloat(route1.stats.clearance)) {
        recommendations.route2.push(`Enhanced safety with ${clearanceDiff}cm additional obstacle clearance`);
    }
    if (route2.stats.bends < route1.stats.bends) {
        recommendations.route2.push(`Optimized flow dynamics with ${Math.abs(bendsDiff)} fewer direction changes`);
    }
    // Add maintenance and cost implications
    if (route2.stats.bends < route1.stats.bends && route2.stats.length < parseFloat(route1.stats.length)) {
        recommendations.route2.push("Lower maintenance requirements due to simplified geometry");
    }
    if (route2.stats.clearance > parseFloat(route1.stats.clearance) && route2.stats.bends < route1.stats.bends) {
        recommendations.route2.push("Improved serviceability with better access");
    }

    // Enhanced comparative analysis with context
    recommendations.comparison = [
        `Route 1 vs Route 2 length difference: ${Math.abs(lengthDiff)}m (${lengthDiff < 0 ? 'Route 2 shorter' : 'Route 1 shorter'})`,
        `Route 1 vs Route 2 bend count difference: ${Math.abs(bendsDiff)} (${bendsDiff < 0 ? 'Route 2 has fewer bends' : 'Route 1 has fewer bends'})`,
        `Route 1 vs Route 2 clearance difference: ${Math.abs(clearanceDiff)}cm (${clearanceDiff > 0 ? 'Route 2 has more clearance' : 'Route 1 has more clearance'})`,
        `Route 1 vs Route 2 performance score difference: ${Math.abs(scoreDiff)} points (${scoreDiff > 0 ? 'Route 2 scores higher' : 'Route 1 scores higher'})`
    ];

    // Add specific recommendations based on vehicle type
    if (route1.vehicleType === 'sports') {
        if (parseFloat(route1.stats.length) < parseFloat(route2.stats.length)) {
            recommendations.route1.push("Ideal for sports vehicle with minimal material usage");
        }
        if (route2.stats.clearance > route1.stats.clearance) {
            recommendations.route2.push("Better ground clearance for enhanced performance");
        }
    }

    // Add recommendations based on pipe type with enhanced distinctions
    if (route1.pipeType === 'fuel') {
        if (route1.stats.clearance > route2.stats.clearance) {
            recommendations.route1.push("Better heat isolation for fuel system");
        }
        if (route2.stats.bends < route1.stats.bends) {
            // Only add this for fuel pipes when not already mentioned in general recommendations
            if (!recommendations.route2.some(rec => rec.includes("flow dynamics"))) {
                recommendations.route2.push("Improved fuel delivery efficiency with streamlined path");
            }
        }
    }

    return recommendations;
}

// Export the function
window.geminiAPI = {
    generateRouteRecommendations
};
