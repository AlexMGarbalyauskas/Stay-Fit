// This file is used to measure and 
// report the performance of the web application.
// It uses the web-vitals library to collect metrics like
// First Contentful Paint (FCP), Largest Contentful Paint (LCP),
// Cumulative Layout Shift (CLS), and others.


// The reportWebVitals function can be called with a callback
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
