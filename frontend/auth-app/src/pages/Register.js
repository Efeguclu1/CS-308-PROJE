import { useState } from "react";
import axios from "axios";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });

      console.log("API Response:", response); // ✅ Hata ayıklama için ekle

      if (response && response.data) {
        setMessage(response.data.message);
      } else {
        setMessage("Beklenmeyen bir hata oluştu!");
      }
    } catch (error) {
      console.error("Register Error:", error);

      if (error.response) {
        setMessage("Kayıt başarısız: " + error.response.data.error);
      } else {
        setMessage("Sunucuya ulaşılamıyor. Backend çalışıyor mu?");
      }
    }
  };

  return (
    <div>
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Kullanıcı Adı" onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Şifre" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Kayıt Ol</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default Register;
