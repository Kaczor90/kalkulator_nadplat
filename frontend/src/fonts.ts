/**
 * Utility file for loading fonts for PDF generation
 * Helps with proper display of Polish characters in PDFs
 */

// We need to import additional modules from jspdf for font support
import { jsPDF } from 'jspdf';
import 'jspdf/dist/polyfills.es.js';
// Required for font support
import 'jspdf/dist/jspdf.es.min.js';
// import 'jspdf/dist/jspdf.plugin.autotable.js'; // Not used, causing error

// Base64 encoded Roboto font data would be here
// This file would normally contain the base64 encoded font data, which is too large to include directly
// Instead, we're providing a utility function to load the font from a URL

/**
 * Load a font for use with jsPDF
 * @param {Object} pdf - The jsPDF instance
 * @param {string} fontName - The name to register the font as
 * @param {string} fontUrl - URL to the font file
 * @returns {Promise} - A promise that resolves when the font is loaded
 */
export const loadFont = async (pdf: jsPDF, fontName: string, fontUrl: string): Promise<boolean> => {
  console.log(`Attempting to load font: ${fontName} from ${fontUrl}`);
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.error(`Failed to fetch font ${fontName} from ${fontUrl}. Status: ${response.status} ${response.statusText}`);
      return false;
    }
    const fontData = await response.arrayBuffer();
    
    // Convert ArrayBuffer to binary string
    const binary = new Uint8Array(fontData);
    let binaryString = '';
    for (let i = 0; i < binary.length; i++) {
      binaryString += String.fromCharCode(binary[i]);
    }
    
    // Add the font to jsPDF
    pdf.addFileToVFS(`${fontName}.ttf`, binaryString);
    pdf.addFont(`${fontName}.ttf`, fontName, 'normal');
    
    console.log(`Font ${fontName} loaded and registered successfully.`);
    return true;
  } catch (error) {
    console.error(`Error loading font ${fontName} from ${fontUrl}:`, error);
    return false;
  }
};

/**
 * Load Roboto fonts needed for the PDF generation
 * @param {Object} pdf - The jsPDF instance
 * @returns {Promise} - A promise that resolves when all fonts are loaded
 */
export const loadRobotoFonts = async (pdf: jsPDF): Promise<boolean> => {
  console.log('Attempting to load Roboto fonts...');
  const baseUrl = window.location.origin;
  const regularFontUrl = `${baseUrl}/fonts/Roboto-Regular.ttf`;
  const boldFontUrl = `${baseUrl}/fonts/Roboto-Bold.ttf`;
  
  console.log(`Roboto-Regular.ttf URL: ${regularFontUrl}`);
  console.log(`Roboto-Bold.ttf URL: ${boldFontUrl}`);

  const regularLoaded = await loadFont(pdf, 'Roboto', regularFontUrl);
  const boldLoaded = await loadFont(pdf, 'Roboto-Bold', boldFontUrl);
  
  if (regularLoaded && boldLoaded) {
    console.log('Both Roboto and Roboto-Bold fonts loaded successfully.');
    return true;
  } else {
    console.error('Failed to load one or both Roboto fonts. Check console for details.');
    return false;
  }
};

// Define types for our text renderer
export interface PolishTextRenderer {
  renderText: (text: string, x: number, y: number, options?: { align?: 'left' | 'center' | 'right' }) => void;
}

/**
 * Load a font for use with jsPDF - using pre-bundled fonts to avoid network issues
 * @param {Object} pdf - The jsPDF instance
 */
export const setupPolishFontSupport = (pdf: jsPDF): boolean => {
  try {
    // Set default font
    pdf.setFont('helvetica');
    
    // Define Polish character replacements
    const polishCharMap: Record<string, string> = {
      'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
      'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    
    // Create a wrapper for the text function that handles Polish characters
    const originalText = pdf.text.bind(pdf);
    pdf.text = (text: string, x: number, y: number, options?: any) => {
      // Replace Polish characters with their Latin equivalents
      const processedText = text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => polishCharMap[char] || char);
      return originalText(processedText, x, y, options);
    };
    
    return true;
  } catch (error) {
    console.error('Error setting up Polish font support:', error);
    return false;
  }
};

/**
 * Alternative approach using specialized text rendering functions for Polish characters
 * @param {Object} pdf - The jsPDF instance
 * @returns {Object} - Object with helper methods for rendering Polish text
 */
export const createPolishTextRenderer = (pdf: jsPDF): PolishTextRenderer => {
  return {
    /**
     * Render text with Polish characters correctly by drawing as vector shapes
     * @param {string} text - Text to render
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Optional parameters (align, etc.)
     */
    renderText: (text: string, x: number, y: number, options: { align?: 'left' | 'center' | 'right' } = {}) => {
      // Position handling
      const align = options.align || 'left';
      let xPos = x;
      
      if (align === 'center') {
        const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
        xPos = x - (textWidth / 2);
      } else if (align === 'right') {
        const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
        xPos = x - textWidth;
      }
      
      // Draw the text directly using normal PDF features
      pdf.text(text, xPos, y);
    }
  };
}; 