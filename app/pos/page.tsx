"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import DateTimeDisplay from "@/components/ui/currentTime";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
// types.ts
export interface Transaction {
  id: number;
  cashier: string;
  items: {
    p_name: string;
    quantity: number;
    total: number;
  }[];
  total: number;
  cashTendered: number;
  change: number;
  date: string;
}

export default function Component() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]); // Adjust type based on your data
  const [total, setTotal] = useState(0);
  const [cashTendered, setCashTendered] = useState(0);
  const [change, setChange] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [barcodes, setBarcode] = useState("");
  const [fullname, setFullname] = useState("");
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedPending, setSelectedPending] = useState(-1);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );

  const barcodeRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const cashTenderedRef = useRef<HTMLInputElement>(null);
  const printReceiptRef = useRef<HTMLButtonElement>(null);
  const openReceiptDialogRef = useRef<HTMLButtonElement>(null);
  const openHotkey = useRef<HTMLButtonElement>(null);
  const saveToPending = useRef<HTMLButtonElement>(null);
  const authDialogTriggerRef = useRef<HTMLButtonElement>(null);
  const submitAuthRef = useRef<HTMLButtonElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Load cashier's fullname from localStorage
  useEffect(() => {
    const storedFullname = localStorage.getItem("fullname");
    if (storedFullname) {
      setFullname(storedFullname);
    }
  }, []);

  // Function to fetch items based on barcode and add them to the cart
  const getItemsFromCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost/phpdata/products.php",
        {
          params: { barcodes },
        }
      );
      const data = response.data;
      if (data && data.p_name) {
        const itemIndex = cart.findIndex((item) => item.p_name === data.p_name);
        if (itemIndex > -1) {
          const updatedCart = [...cart];
          const existingItem = updatedCart[itemIndex];
          const newQuantity = existingItem.quantity + quantity;
          existingItem.quantity = newQuantity;
          existingItem.total = data.price * newQuantity;

          const newTotal = cart.reduce((acc, item) => acc + item.total, 0);
          setTotal(newTotal);
          setCart(updatedCart);

          toast({
            variant: "success",
            description: `Updated quantity for ${data.p_name} in cart.`,
          });
        } else {
          const newItem = {
            ...data,
            quantity,
            total: data.price * quantity,
          };
          const newTotal = total + data.price * quantity;
          setCart([...cart, newItem]);
          setTotal(newTotal);

          toast({
            variant: "success",
            description: `Added ${data.p_name} to cart.`,
          });
        }
      } else {
        toast({ variant: "destructive", description: "Item not found." });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({ variant: "destructive", description: "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode input change
  const handleBarcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(event.target.value);
  };

  // Handle quantity input change
  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Number(event.target.value));
  };

  const savePendingTransaction = () => {
    const currentTransaction: Transaction = {
      id: Date.now(),
      items: cart,
      total: cart.reduce((sum, item) => sum + item.total, 0),
      cashTendered: 0, // Adjust as needed
      change: 0, // Adjust as needed
      date: new Date().toISOString().split("T")[0],
    };

    const storedTransactions = JSON.parse(
      localStorage.getItem("pendingTransactions") || "[]"
    );
    const newPendingTransactions = [...storedTransactions, currentTransaction];
    localStorage.setItem(
      "pendingTransactions",
      JSON.stringify(newPendingTransactions)
    );

    // Update the state with the new transactions
    setPendingTransactions(newPendingTransactions);
    setCart([]);
    toast({
      variant: "success",
      description: "Transaction saved.",
    });
  };

  const deletePendingTransaction = (index: number) => {
    const newPendingTransactions = pendingTransactions.filter(
      (_, i) => i !== index
    );
    setPendingTransactions(newPendingTransactions);
    localStorage.setItem(
      "pendingTransactions",
      JSON.stringify(newPendingTransactions)
    );
  };

  const retrievePendingTransaction = (index: number) => {
    const transaction = pendingTransactions[index];
    deletePendingTransaction(index);
    setCart(transaction.items);
    toast({
      variant: "success",
      description: "Transaction retrieved.",
    });
  };
  useEffect(() => {
    if (isAuthDialogOpen) {
      // Delay focusing to ensure dialog is fully rendered
      const timeoutId = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId); // Clean up timeout if dialog is closed before focus
    }
  }, [isAuthDialogOpen]);
  // Key press handling for hotkeys
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Navigate to Barcode Input: W
      if (event.key === "w") {
        event.preventDefault();
        barcodeRef.current?.focus();
      }

      // Navigate to Quantity Input: Q
      if (event.key === "q") {
        event.preventDefault();
        quantityRef.current?.focus();
      }

      // Navigate to Cash Tendered Input: E
      if (event.key === "e") {
        event.preventDefault();
        cashTenderedRef.current?.focus();
      }

      // Print Receipt: R
      if (event.key === "r") {
        event.preventDefault();
        printReceiptRef.current?.click();
      }

      // Add Item to Cart: Ctrl + Enter
      if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        getItemsFromCart();
        setBarcode("");
      }

      // Clear Barcode Input: Ctrl + C
      if (event.key === "c" && event.ctrlKey) {
        event.preventDefault();
        setBarcode("");
      }

      // Clear Quantity Input: Ctrl + Q
      if (event.key === "q" && event.ctrlKey) {
        event.preventDefault();
        setQuantity(1);
      }
      if (event.key === "t") {
        event.preventDefault();
        openReceiptDialogRef.current?.click();
      }
      // Submit Payment: Ctrl + S
      if (event.key === "s" && event.ctrlKey) {
        event.preventDefault();
        processPayment();
      }
      if (event.key === "h" && event.ctrlKey) {
        event.preventDefault();
        openHotkey.current?.click();
      }
      if (event.key === "n") {
        event.preventDefault();
        newTransaction();
      }
      // Void Cart: V

      if (event.key === "v") {
        event.preventDefault();
        setIsAuthDialogOpen(true); // Open the dialog
        authDialogTriggerRef.current?.click();
      }
      if (event.key === "b" && event.ctrlKey) {
        event.preventDefault();
        handleAuthSubmit("voidCart");
      } // En

      if (event.key === "[") {
        event.preventDefault();
        setSelectedPending((prevIndex) =>
          prevIndex < pendingTransactions.length - 1 ? prevIndex + 1 : prevIndex
        );
      }
      if (event.key === "]") {
        event.preventDefault();
        setSelectedPending((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex
        );
      }
      if (event.key === "z" && event.ctrlKey) {
        event.preventDefault();
        handleAuthSubmit("generateReport"); // Generate Z report
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedItemIndex((prevIndex) =>
          prevIndex < cart.length - 1 ? prevIndex + 1 : prevIndex
        );
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedItemIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex
        );
      }
      if (event.key === "d") {
        event.preventDefault();
        showPendingTransactions();
      }

      if (event.key === "a") {
        event.preventDefault();
        // Ensure selectedPending is within the bounds of pendingTransactions
        if (selectedPending >= 0) {
          // Call the function to retrieve the transaction
          retrievePendingTransaction(selectedPending);
          // Optionally, you could remove the transaction or update the state if needed
        }
      }
      if (event.key === "f") {
        saveToPending.current?.click();
      }
      if (
        event.key === "Shift" &&
        event.code === "ShiftLeft" &&
        selectedItemIndex >= 0
      ) {
        event.preventDefault();
        const newQuantity = prompt("Enter new quantity:");

        if (newQuantity !== null && !isNaN(newQuantity)) {
          const updatedCart = cart.map((item, index) =>
            index === selectedItemIndex
              ? {
                  ...item,
                  quantity: parseInt(newQuantity, 10),
                  total: item.price * parseInt(newQuantity, 10),
                }
              : item
          );
          setCart(updatedCart);
          setSelectedItemIndex(-1); // Reset selection after updating quantity
          toast({
            variant: "success",
            description: "Quantity updated.",
          });
        }
      }

      // Update quantity: Right Shift
      if (
        event.key === "Shift" &&
        event.code === "ShiftRight" &&
        selectedItemIndex >= 0
      ) {
        event.preventDefault();
        const newCart = cart.filter((_, index) => index !== selectedItemIndex);
        setCart(newCart);
        setSelectedItemIndex(-1); // Reset selection after deletion
        toast({
          variant: "success",
          description: "Item deleted from cart.",
        });
      }
    },
    [
      barcodes,
      quantity,
      cart,
      total,
      cashTendered,
      selectedItemIndex,
      pendingTransactions,
      authDialogTriggerRef,
      passwordInputRef,
    ]
  );
  const showPendingTransactions = () => {
    // Optionally, scroll to the pending transactions table or open a modal
    console.log("Displaying pending transactions:");
    setSelectedPending(0); // Optionally set the selected pending transaction to the first one
    // You could also use a state to show or hide a modal containing pending transactions
  };
  const newTransaction = () => {
    setCart([]);
    setTotal(0);
    setCashTendered(0);
    setChange(0);
    setBarcode("");
    setQuantity(1);
    setFullname(""); // Clear cashier's name or set it to the default if needed
    toast({
      variant: "success",
      description: "New transaction started.",
    });
  };
  // Effect for adding and removing keydown event listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  const processPayment = () => {
    if (cashTendered >= total) {
      const changeAmount = cashTendered - total;
      setChange(changeAmount);

      const transaction = {
        cashier: localStorage.getItem("fullname"),
        items: cart,
        total: total,
        cashTendered: cashTendered,
        change: changeAmount,
        date: new Date().toISOString(),
        shiftNumber: localStorage.getItem("id"),
      };

      saveShiftReport(transaction);

      toast({
        variant: "success",
        description: `Payment processed. Change: ₱${changeAmount.toFixed(2)}`,
      });
      console.log(transaction);
    } else {
      toast({
        variant: "destructive",
        description: "Insufficient cash tendered.",
      });
    }
  };

  const saveShiftReport = (transaction) => {
    const reports = JSON.parse(localStorage.getItem("shiftReports") || "[]");
    console.log("Stored reports:", reports);

    reports.push(transaction);

    localStorage.setItem("shiftReports", JSON.stringify(reports));
  };

  const generateShiftReport = () => {
    const reports = JSON.parse(localStorage.getItem("shiftReports")) || [];
    console.log("All reports:", reports);

    const currentCashier = localStorage.getItem("fullname");
    const currentShift = localStorage.getItem("id");

    const filteredReports = reports.filter(
      (report) =>
        report.cashier === currentCashier && report.shiftNumber === currentShift
    );

    const grandTotal = filteredReports.reduce((sum, t) => sum + t.total, 0);

    const reportHtml = `
    <html>
      <head>
        <title>Shift Report</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            justify-content: center;
            align-items: center;
          }
          .report {
            margin: 0 auto;
            width: 300px;
            border: 1px dashed #000;
            padding: 20px;
            background-color: #fff;
          }
          .header {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .item {
            margin-bottom: 10px;
            display: flex;
          
          }
          .item div {
            width: 45%;
            padding: 5px;
          }
          .total {
            font-weight: bold;
            border-top: 1px dashed #000;
            padding-top: 10px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="report">
        div class="header">GAISANO</div>
          <div class="header">Shift Report for Shift ${currentShift}</div>
          ${filteredReports
            .map(
              (transaction) => `
                <div class="item">
                  <div>Cashier:</div>
                  <div>${transaction.cashier}</div>
                </div>
                <div class="item">
                  <div>Date:</div>
                  <div>${transaction.date}</div>
                </div>
                <div class="item">
                  <div>Total:</div>
                  <div>₱${transaction.total.toFixed(2)}</div>
                </div>
                <hr>
              `
            )
            .join("")}
          <div class="total">
            <div>Grand Total:</div>
            <div>₱${grandTotal.toFixed(2)}</div>
          </div>
        </div>
      </body>
    </html>
  `;

    const reportWindow = window.open("", "", "width=800,height=600");
    if (reportWindow) {
      reportWindow.document.open();
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
      reportWindow.focus();
      // reportWindow.print(); // Uncomment to automatically print the report
    }
  };

  const handleGenerateReport = () => {
    generateShiftReport();
  };
  const generateZReport = () => {
    console.log(true);
    const reports = JSON.parse(localStorage.getItem("shiftReports")) || [];

    // Sort the reports by ID (1 first, then 2, then 3)
    reports.sort((a, b) => a.id - b.id);

    // Generate the HTML for the Z report
    const reportHtml = `
    <html>
      <head>
        <title>GAISANO</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            width: 300px;
          }
          .report {
            border: 1px solid #000;
            padding: 10px;
          }
          .header, .footer {
            text-align: center;
            font-weight: bold;
          }
          .item {
            display: flex;
            justify-content: space-between;
          }
          .item:last-child {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .separator {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          pre {
            font-family: 'Courier New', monospace;
            white-space: pre;
            font-size: inherit;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <pre class="header">GAISANO</pre>
        
          ${reports
            .map(
              (report) => `
                <div class="item">
                  <div>Cashier:</div>
                  <div>${report.cashier}</div>
                </div>
                <div class="item">
                  <div>Date:</div>
                  <div>${report.date}</div>
                </div>
                <div class="item">
                  <div>Total:</div>
                  <div>₱${report.total.toFixed(2)}</div>
                </div>
                <hr>
              `
            )
            .join("")}
          <div class="separator"></div>
          <div class="item">
            <div>Total Transactions:</div>
            <div>${reports.length}</div>
          </div>
          <div class="item">
            <div>Grand Total:</div>
            <div>₱${reports
              .reduce((sum, report) => sum + report.total, 0)
              .toFixed(2)}</div>
          </div>
          <pre class="footer">End of Z Report</pre>
        </div>
      </body>
    </html>
  `;

    // Open the report in a new window
    const reportWindow = window.open("", "", "width=800,height=600");
    if (reportWindow) {
      reportWindow.document.open();
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
      reportWindow.focus();
      // Uncomment the line below to automatically print the report
      // reportWindow.print();
    }
  };

  const logout = () => {
    const shiftReports = localStorage.getItem("shiftReports");

    // Clear all local storage
    localStorage.clear();

    // Restore the shift reports
    if (shiftReports) {
      localStorage.setItem("shiftReports", shiftReports);
    }

    // Redirect to login page and show a success toast
    router.push("/");
    toast({ title: "Logged out successfully", variant: "success" });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "G" && event.shiftKey) {
        event.preventDefault();
        handleGenerateReport(); // Generate report based on current shift
      }
      if (event.key === "L" && event.shiftKey) {
        event.preventDefault();
        logout(); // Logout the user
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Function to print the receipt
  const printReceipt = () => {
    const fullname = localStorage.getItem("fullname");
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
    <html>
    <head>
    <title>Receipt</title>
    <style>
      body {
      font-family: 'Courier New', monospace;
      margin: 0;
      padding: 20px;
      width: 300px;
      }
      .receipt {
      border: 1px solid #000;
      padding: 10px;
      }
      .header, .footer {
      text-align: center;
      font-weight: bold;
      }
      .item {
      display: flex;
      justify-content: space-between;
      }
      .item:last-child {
      border-top: 1px solid #000;
      padding-top: 10px;
      margin-top: 10px;
      }
      .separator {
      border-top: 1px dashed #000;
      margin: 10px 0;
      }
      pre {
      font-family: 'Courier New', monospace;
      white-space: pre;
      font-size: inherit;
      margin: 0;
      }
    </style>
    </head>
    <body>
    <div class="receipt">
      <pre class="header">POS Receipt</pre>
      <pre>Cashier: ${fullname}</pre>
      ${cart
        .map(
          (item) => `
      <pre class="item">
      <div>${item.p_name}</div>
      <div>₱${item.total.toFixed(2)}</div>
      </pre>
      `
        )
        .join("")}
      <div class="separator"></div>
      <pre class="item">
      <div>Cash Tendered:</div>
      <div>₱${cashTendered.toFixed(2)}</div>
      </pre>
      
       <pre class="item">
      <div>Total:</div>
      <div>₱${total.toFixed(2)}</div>
      </pre>
       <pre class="item">
      <div>Change:</div>
      <div>₱${change.toFixed(2)}</div>
      </pre>
      <pre class="footer">Thank you for shopping!</pre>
    </div>
    </body>
    </html>
    `);
      printWindow.document.close();
      printWindow.focus();
      //   printWindow.print();
    }
  };
  const handleAuthSubmit = (action: "voidCart" | "generateReport") => {
    const correctPassword = adminPassword;
    console.log(adminPassword);
    if (adminPassword === correctPassword) {
      if (action === "voidCart") {
        setIsAuthorized(true);
        voidCart();
        toast({
          variant: "success",
          description: "Cart voided successfully.",
        });
      } else if (action === "generateReport") {
        setIsAuthorized(true);
        generateZReport();
        toast({
          variant: "success",
          description: "Z Report generated successfully.",
        });
      }
      setAdminPassword("");
      setIsAuthDialogOpen(false);
    } else {
      toast({
        variant: "destructive",
        description: "Invalid admin password.",
      });
    }
  };

  const voidCart = () => {
    setCart([]);
    setTotal(0);
    setCashTendered(0);
    setChange(0);
    setBarcode("");
    setQuantity(1);

    toast({
      variant: "success",
      description: "Cart has been voided.",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-6 w-full h-[100vh] max-w-10xl mx-auto p-4 md:p-6">
      <div
        id="cashiersTab"
        className="flex flex-col gap-4 bg-zinc-800 text-white rounded-sm p-6 col-span-2"
      >
        <div className="p-4  rounded-sm bg-white">
          {" "}
          <Image src={"/LOGO.jpg"} alt="Logo" width={500} height={300} />
        </div>
        <div className="text-white">
          <DateTimeDisplay />
        </div>{" "}
        <pre className="text-3xl">Cashier: {fullname}</pre>
        <pre className="animate-pulse"> Show Hotkeys (Ctrl + H)</pre>
        <button
          onClick={savePendingTransaction}
          ref={saveToPending}
          className="hidden"
        >
          Save Transaction
        </button>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="hidden"
              ref={openHotkey}
            >
              Show Hotkeys (Ctrl + H)
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-zinc-900  border-zinc-800 ">
            <SheetHeader>
              <SheetTitle className="text-blue-300">Hotkeys</SheetTitle>
              <SheetDescription>
                <div className="bg-blue-400 p-4  rounded-lg">
                  <ul className="list-disc list-inside text-zinc-900">
                    <li>
                      <strong>W:</strong> Navigate to Barcode Input
                    </li>
                    <li>
                      <strong>Q:</strong> Navigate to Quantity Input
                    </li>
                    <li>
                      <strong>E:</strong> Navigate to Cash Tendered Input
                    </li>
                    <li>
                      <strong>R:</strong> Print Receipt
                    </li>
                    <li>
                      <strong>Ctrl + Enter:</strong> Add Item to Cart
                    </li>
                    <li>
                      <strong>Ctrl + B :</strong> Submit Admin Password
                    </li>
                    <li>
                      <strong>V :</strong> Void
                    </li>
                    <li>
                      <strong>T:</strong> Open Receipt Dialog
                    </li>
                    <li>
                      <strong>Ctrl + S:</strong> Submit Payment
                    </li>
                    <li>
                      <strong>Shift + G:</strong> Generate Shift Report
                    </li>
                    <li>
                      <strong>[:</strong> Navigate through Pending Transactions
                      (Next)
                    </li>
                    <li>
                      <strong>]:</strong> Navigate through Pending Transactions
                      (Previous)
                    </li>
                    <li>
                      <strong>Arrow Up/Down:</strong> Navigate through Cart
                      Items
                    </li>
                    <li>
                      <strong> F :</strong>Save to Pending
                    </li>
                    <li>
                      <strong> A :</strong>Retrieve Pending
                    </li>
                    <li>
                      <strong>Shift + SemiColon :</strong> Retrieve Selected
                      Pending Transaction
                    </li>
                    <li>
                      <strong>Shift (Left):</strong> Update Quantity of Selected
                      Cart Item
                    </li>
                    <li>
                      <strong>Shift (Right):</strong> Delete Selected Cart Item
                    </li>
                  </ul>
                </div>
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <div className="block border rounded-sm  bg-blue-100">
          <div className="max-h-[300px] overflow-y-auto border border-gray-200">
            <Table className="text-xl min-w-full">
              <TableHeader>
                <TableRow className="bg-blue-800 ">
                  <TableHead className="bg-blue-800 row-span-3 w-full">
                    Pending
                  </TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransactions.map((transaction, index) => (
                  <TableRow
                    key={transaction.id}
                    className={selectedPending === index ? "bg-blue-300" : ""}
                  >
                    <TableCell className="py-4 px-6 text-black">
                      <button
                        onClick={() => retrievePendingTransaction(index)}
                        className="hidden"
                      >
                        Retrieve
                      </button>
                      Transaction #{index + 1}
                    </TableCell>

                    <TableCell className="py-4 px-6 text-black">
                      ₱{transaction.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-black">
                      {transaction.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div
        id="inputsTab"
        className="flex flex-col gap-4 bg-zinc-800 text-white rounded-sm p-6 col-span-5 h-full"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              placeholder="Scan barcode"
              className="text-xl text-black py-4 px-6 h-14"
              value={barcodes}
              onChange={handleBarcodeChange}
              ref={barcodeRef}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              min={1}
              className="text-xl py-4 px-6 h-14 text-black"
              onChange={handleQuantityChange}
              ref={quantityRef}
            />
          </div>
        </div>
        <div className="flex-1 border rounded-lg overflow-auto bg-blue-100">
          <AlertDialog
            open={isAuthDialogOpen}
            onOpenChange={setIsAuthDialogOpen}
          >
            <AlertDialogTrigger ref={authDialogTriggerRef} className="hidden">
              Open Auth Dialog
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader className="text-4xl font-bold text-blue-800">
                Admin Authorization
              </AlertDialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-blue-400">
                  Admin Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  ref={passwordInputRef}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {/* <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleAuthSubmit}
                >
                  Submit
                </button> */}
                {/* <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setIsAuthDialogOpen(false)}
                >
                  Cancel
                </button> */}
              </div>
            </AlertDialogContent>
          </AlertDialog>
          <Table className="text-xl">
            <TableHeader>
              <TableRow className="bg-blue-800 ">
                <TableHead className="text-white ">Barcode</TableHead>
                <TableHead className="text-white ">Item</TableHead>
                <TableHead className="text-white ">Qty</TableHead>
                <TableHead className="text-white ">Price</TableHead>
                <TableHead className="text-white ">Total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cart.map((item, index) => (
                <TableRow
                  key={index}
                  className={selectedItemIndex === index ? "bg-blue-300" : ""}
                >
                  {" "}
                  <TableCell className="py-4 px-6 text-black">
                    {item.barcode}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-black">
                    {item.p_name}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-black">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-black">
                    ₱{item.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-black">
                    ₱{item.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <h1 className="text-5xl">Total: {total}</h1>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cash-tendered">Cash Tendered</Label>
            <Input
              id="cash-tendered"
              type="number"
              value={cashTendered}
              min={0}
              className="text-xl text-black py-4 px-6 h-14"
              onChange={(e) => setCashTendered(Number(e.target.value))}
              ref={cashTenderedRef}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="change">Change</Label>
            <h1
              id="change"
              className="text-xl bg-white rounded-sm text-black py-4 px-6 h-14"
            >
              PHP &nbsp;
              {change}
            </h1>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="py-3 px-6 hidden"
            ref={printReceiptRef}
            onClick={printReceipt}
          >
            Print
          </Button>
        </div>
        <AlertDialog>
          <AlertDialogTrigger className="hidden " ref={openReceiptDialogRef}>
            Open Receipt
          </AlertDialogTrigger>
          <AlertDialogContent className=" bg-zinc-800 rounded-sm border-zinc-800">
            {" "}
            <div
              id="receiptTab"
              className="flex flex-col gap-4 p-6 bg-zinc-800 rounded-sm col-span-2"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Receipt</h3>
                </div>
                <Separator />

                <div className="space-y-2 text-lg">
                  <ScrollArea className="h-[70vh] w-[100%] rounded-md border p-4 bg-blue-300">
                    {cart.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {item.p_name} x {item.quantity}
                        </span>

                        <span>₱{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </ScrollArea>
                  <Separator />

                  <div className="pt-2 flex text-white items-center justify-between font-bold">
                    <span>Total</span>
                    <span>₱{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
