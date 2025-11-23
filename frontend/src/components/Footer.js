import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#f2efeb] border-t mt-6">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h3 className="text-base font-semibold">Readar</h3>
            <p className="mt-1 text-sm text-gray-600">Share books. Borrow books. Build community.</p>
            <p className="mt-1 text-xs text-gray-500">© {year} Readar. All rights reserved.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Contact</h4>
              <a href="mailto:hello@readar.example" className="text-sm text-gray-600 hover:underline">readarplatform@gmail.com</a>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700">Follow</h4>
              <div className="flex gap-3 mt-1">
                <a href="https://github.com/hrmtsh2" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">GitHub</a>
                <a href="https://twitter.com/readarplatform" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-500">Twitter</a>
                <a href="https://linkedin.com/company/readar-platform" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-700">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
