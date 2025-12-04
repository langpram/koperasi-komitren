import { db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment
} from "firebase/firestore";

// ambil stok semua barang dari 1 cabang
export async function getStokCabang(cabang) {
  const colRef = collection(db, "cabang", cabang, "stok");
  const snap = await getDocs(colRef);
  const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return data;
}

// tambah transaksi input
export async function tambahInput(cabang, inputData) {
  const trxRef = collection(db, "cabang", cabang, "transaksi");
  await addDoc(trxRef, {
    ...inputData,
    jenis: "input",
    createdAt: new Date()
  });

  // update stok
  const stokRef = doc(db, "cabang", cabang, "stok", inputData.namaProduk);
  await updateDoc(stokRef, {
    jumlah: increment(inputData.jumlah)
  }).catch(async () => {
    // kalau belum ada stok → buat baru
    await setDoc(stokRef, {
      nama: inputData.namaProduk,
      jumlah: inputData.jumlah
    });
  });
}

// tambah transaksi output
export async function tambahOutput(cabang, outputData) {
  const trxRef = collection(db, "cabang", cabang, "transaksi");
  await addDoc(trxRef, {
    ...outputData,
    jenis: "output",
    createdAt: new Date()
  });

  // kurangi stok
  const stokRef = doc(db, "cabang", cabang, "stok", outputData.namaProduk);
  await updateDoc(stokRef, {
    jumlah: increment(-outputData.jumlah)
  });
}
