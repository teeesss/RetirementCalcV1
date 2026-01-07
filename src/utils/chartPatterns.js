
/**
 * Generates a diagonal stripe pattern for Chart.js
 * @param {string} color - The foreground color of the stripes
 * @param {string} backgroundColor - The background color (default 'transparent')
 * @returns {CanvasPattern}
 */
export const getStripePattern = (color = 'rgba(0,0,0,0.5)', backgroundColor = 'transparent') => {
    // Create a small canvas to draw the pattern
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw diagonal stripes
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Main diagonal
    ctx.moveTo(0, 10);
    ctx.lineTo(10, 0);
    // Wrap-around diagonals to ensure seamless tiling
    ctx.moveTo(-1, 1);
    ctx.lineTo(1, -1);
    ctx.moveTo(9, 11);
    ctx.lineTo(11, 9);
    ctx.stroke();

    return ctx.createPattern(canvas, 'repeat');
};

/**
 * Generates a horizontal stripe pattern for Chart.js
 * @param {string} color
 * @param {string} backgroundColor
 * @returns {CanvasPattern}
 */
export const getHorizontalStripePattern = (color = 'rgba(0,0,0,0.5)', backgroundColor = 'transparent') => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(10, 5);
    ctx.stroke();

    return ctx.createPattern(canvas, 'repeat');
};
