const SimpleLayout = ({ HeaderContent, children }) => (
  <>
    <header className="flex justify-center border-b mb-2 bg-background z-10">
      <div className="container mx-auto px-4 py-4">{HeaderContent}</div>
    </header>
    <div className="container p-4 mx-auto overflow-auto">{children}</div>
  </>
);

export default SimpleLayout;
