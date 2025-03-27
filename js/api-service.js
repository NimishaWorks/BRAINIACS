// Gemini API integration for detailed analysis reports
class AnalysisAPIService {
    constructor() {
        // Initialize with your Gemini API key
        this.apiKey = 'YOUR_GEMINI_API_KEY';
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async generateDetailedReport(simulationData) {
        try {
            // For now, generate a mock report since we don't have API key
            return this.generateMockReport(simulationData);
        } catch (error) {
            console.error('Error generating report:', error);
            return {
                summary: 'Error generating detailed report',
                recommendations: ['Unable to generate recommendations at this time'],
                materialSuggestions: [],
                maintenanceSchedule: [],
                safetyConsiderations: [],
                reliabilityProjections: []
            };
        }
    }

    generateMockReport(data) {
        const { analysisType, operatingCondition, pipes } = data;
        const criticalPipes = pipes.filter(p => p.stress > 0.7);
        const highStressPipes = pipes.filter(p => p.stress > 0.4 && p.stress <= 0.7);
        
        // Base summary that includes actual pipe counts
        const baseSummary = `Analysis completed for ${pipes.length} pipe segments under ${operatingCondition} conditions. ` +
                          `Identified ${criticalPipes.length || 'potential'} critical points and ${highStressPipes.length || 'several'} high-stress areas ` +
                          `during ${analysisType} analysis.`;

        // Analysis type specific details
        const analysisDetails = {
            pressure: {
                summary: baseSummary + ' Pressure distribution analysis reveals areas requiring immediate attention to prevent potential leaks and structural weaknesses.',
                recommendations: [
                    'Install pressure relief valves at identified critical points',
                    'Reinforce pipe walls in high-pressure zones',
                    'Implement pressure monitoring systems at key junctions',
                    'Consider parallel routing for critical segments to distribute load'
                ],
                materialSuggestions: [
                    'Use high-pressure rated steel pipes for critical segments',
                    'Install flexible connectors at high-stress joints',
                    'Upgrade to reinforced composite materials in peak pressure zones',
                    'Implement double-wall construction for critical sections'
                ]
            },
            thermal: {
                summary: baseSummary + ' Thermal analysis indicates potential expansion/contraction stress points requiring specialized materials and design considerations.',
                recommendations: [
                    'Install thermal expansion joints at key points',
                    'Implement heat shielding in high-temperature zones',
                    'Add temperature monitoring systems',
                    'Design for thermal cycling fatigue prevention'
                ],
                materialSuggestions: [
                    'Use temperature-resistant alloys in high-heat zones',
                    'Install thermal insulation coating on exposed segments',
                    'Implement composite materials with low thermal expansion',
                    'Use specialized heat-resistant gaskets at joints'
                ]
            },
            vibration: {
                summary: baseSummary + ' Vibration analysis highlights potential resonance points and areas requiring dampening solutions.',
                recommendations: [
                    'Install vibration dampeners at key points',
                    'Reinforce pipe supports in high-vibration areas',
                    'Implement flexible mounting systems',
                    'Add vibration monitoring sensors'
                ],
                materialSuggestions: [
                    'Use vibration-dampening pipe materials',
                    'Install flexible coupling joints',
                    'Implement composite materials with better vibration absorption',
                    'Use specialized anti-vibration mounts'
                ]
            },
            combined: {
                summary: baseSummary + ' Combined stress analysis reveals complex interaction patterns requiring comprehensive solutions.',
                recommendations: [
                    'Implement multi-factor monitoring systems',
                    'Design comprehensive support structures',
                    'Install smart sensors for real-time analysis',
                    'Create redundant safety systems'
                ],
                materialSuggestions: [
                    'Use advanced composite materials for multi-stress resistance',
                    'Implement smart materials with adaptive properties',
                    'Install hybrid material systems for complex stress patterns',
                    'Use specialized coatings for multiple protection layers'
                ]
            }
        };

        const analysis = analysisDetails[analysisType] || analysisDetails.combined;
        
        // Generate maintenance schedule based on operating condition
        const maintenanceFrequency = operatingCondition === 'extreme' ? 'weekly' : 
                                   operatingCondition === 'high-load' ? 'bi-weekly' : 'monthly';
        
        return {
            summary: analysis.summary,
            recommendations: analysis.recommendations,
            materialSuggestions: analysis.materialSuggestions,
            
            maintenanceSchedule: [
                `${maintenanceFrequency.charAt(0).toUpperCase() + maintenanceFrequency.slice(1)} inspection of critical points`,
                `${operatingCondition === 'extreme' ? 'Daily' : 'Weekly'} monitoring of high-stress areas`,
                'Quarterly full system inspection',
                `${operatingCondition === 'normal' ? 'Annual' : 'Semi-annual'} preventive maintenance`
            ],
            
            safetyConsiderations: [
                `Install ${analysisType}-specific monitoring sensors`,
                'Implement automated emergency shutdown protocols',
                'Create containment zones around high-risk areas',
                `Add ${analysisType === 'thermal' ? 'temperature' : analysisType === 'pressure' ? 'pressure' : 'stress'} relief systems`
            ],
            
            reliabilityProjections: [
                `Expected system lifetime: ${operatingCondition === 'extreme' ? '8-10' : operatingCondition === 'high-load' ? '12-15' : '15-20'} years with proper maintenance`,
                `Recommended replacement schedule for critical components: ${operatingCondition === 'extreme' ? '2' : operatingCondition === 'high-load' ? '3' : '5'} years`,
                `${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} monitoring calibration needed ${operatingCondition === 'extreme' ? 'monthly' : 'quarterly'}`,
                'Regular stress point reinforcement based on monitoring data'
            ]
        };
    }

    constructReportPrompt(data) {
        const { analysisType, operatingCondition, pipes } = data;
        
        // Construct a detailed prompt for the Gemini API
        return `Generate a detailed engineering analysis report for a pipe system with the following parameters:
        
Analysis Type: ${analysisType}
Operating Condition: ${operatingCondition}
Number of Pipes: ${pipes.length}
Critical Points: ${pipes.filter(p => p.stress > 0.7).length}
High Stress Areas: ${pipes.filter(p => p.stress > 0.4 && p.stress <= 0.7).length}

Pipe Details:
${pipes.map(p => `- ${p.name}: Stress Level ${(p.stress * 100).toFixed(1)}%, Material: ${p.material}`).join('\n')}

Please provide:
1. A comprehensive analysis of the system's performance
2. Detailed recommendations for system optimization
3. Material upgrade suggestions for high-stress components
4. Maintenance schedule recommendations
5. Safety considerations and critical points analysis
6. Long-term reliability projections`;
    }

    formatReport(apiResponse) {
        try {
            // Extract the generated text from the API response
            const generatedText = apiResponse.candidates[0].content.parts[0].text;
            
            // Parse the response into structured sections
            const sections = generatedText.split('\n\n');
            
            return {
                summary: sections[0] || 'Analysis complete',
                recommendations: this.extractRecommendations(sections),
                materialSuggestions: this.extractMaterialSuggestions(sections),
                maintenanceSchedule: this.extractMaintenanceSchedule(sections),
                safetyConsiderations: this.extractSafetyConsiderations(sections),
                reliabilityProjections: this.extractReliabilityProjections(sections)
            };
        } catch (error) {
            console.error('Error formatting report:', error);
            return {
                summary: 'Error formatting report',
                recommendations: ['Unable to process recommendations'],
                materialSuggestions: []
            };
        }
    }

    extractRecommendations(sections) {
        // Extract and format recommendations from the API response
        const recommendationsSection = sections.find(s => s.includes('recommendations')) || '';
        return recommendationsSection
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(2));
    }

    extractMaterialSuggestions(sections) {
        // Extract and format material suggestions from the API response
        const materialsSection = sections.find(s => s.includes('Material')) || '';
        return materialsSection
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(2));
    }

    extractMaintenanceSchedule(sections) {
        // Extract maintenance schedule recommendations
        const maintenanceSection = sections.find(s => s.includes('Maintenance')) || '';
        return maintenanceSection
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(2));
    }

    extractSafetyConsiderations(sections) {
        // Extract safety considerations
        const safetySection = sections.find(s => s.includes('Safety')) || '';
        return safetySection
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(2));
    }

    extractReliabilityProjections(sections) {
        // Extract reliability projections
        const reliabilitySection = sections.find(s => s.includes('Reliability')) || '';
        return reliabilitySection
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(2));
    }
}

// Export the service
window.AnalysisAPIService = new AnalysisAPIService();
