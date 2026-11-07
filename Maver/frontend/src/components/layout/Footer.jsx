function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
           <img src="/src/assets/logo.png" style={{ width: '35px', marginRight: '1px' }} />        
          <span>AVER</span>
          </div>
          <p>&copy; 2025 MAVER. All rights reserved.</p>
          <div className="footer-links">
            <a href="#"><i className="bi bi-facebook"></i></a>
            <a href="#"><i className="bi bi-twitter"></i></a>
            <a href="#"><i className="bi bi-instagram"></i></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

