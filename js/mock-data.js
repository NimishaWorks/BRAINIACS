// Sample pipe model structure
const samplePipeModel = {
    "pipes": [
        {
            "id": "pipe1",
            "name": "Main Fuel Line",
            "start": { "x": -2, "y": 0.5, "z": 0.8 },
            "end": { "x": -1, "y": 0.8, "z": 0.8 },
            "radius": 0.08,
            "material": "steel"
        },
        {
            "id": "pipe2",
            "name": "Engine Connection",
            "start": { "x": -1, "y": 0.8, "z": 0.8 },
            "end": { "x": 0.5, "y": 0.8, "z": 0.8 },
            "radius": 0.08,
            "material": "rubber"
        },
        {
            "id": "pipe3",
            "name": "Return Line",
            "start": { "x": 0.5, "y": 0.8, "z": 0.8 },
            "end": { "x": 1, "y": 1.2, "z": 0.5 },
            "radius": 0.06,
            "material": "aluminum"
        }
    ]
};

// Export for use in other files
window.samplePipeModel = samplePipeModel;
