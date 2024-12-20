import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Rating from './Rating';
import close from '../assets/close.svg';

const Product = ({ item, provider, account, dappazon, togglePop }) => {
  const [order, setOrder] = useState(null);
  const [hasBought, setHasBought] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [addressSubmitted, setAddressSubmitted] = useState(false);
  const [addressDetails, setAddressDetails] = useState({}); // Store address details
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // Success popup state
  const [ethToInr, setEthToInr] = useState(null); // Store ETH to INR conversion rate

  const fetchDetails = async () => {
    const events = await dappazon.queryFilter("Buy");
    const orders = events.filter(
      (event) => event.args.buyer === account && event.args.itemId.toString() === item.id.toString()
    );

    if (orders.length === 0) return;

    const order = await dappazon.orders(account, orders[0].args.orderId);
    setOrder(order);
  };

  const fetchEthToInr = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr');
      const data = await response.json();
      setEthToInr(data.ethereum.inr);
    } catch (error) {
      console.error('Error fetching ETH to INR conversion rate:', error);
    }
  };

  const buyHandler = async () => {
    const signer = await provider.getSigner();

    // Buy item...
    let transaction = await dappazon.connect(signer).buy(item.id, { value: item.cost });
    await transaction.wait();

    setHasBought(true);
    setShowSuccessPopup(true); // Show success popup after purchase
  };

  const handleAddressSubmit = (e, addressData) => {
    e.preventDefault();
    setAddressDetails(addressData);
    setAddressSubmitted(true);
    setShowAddressPopup(false);
  };

  useEffect(() => {
    fetchDetails();
    fetchEthToInr();
  }, [hasBought]);

  return (
    <div className="product">
      <div className="product__details">
        <div className="product__image">
          <img src={item.image} alt="Product" />
        </div>
        <div className="product__overview">
          <h1>{item.name}</h1>
          <Rating value={item.rating} />
          <hr />
          <p>{item.address}</p>
          <h2>
            {ethers.utils.formatUnits(item.cost.toString(), 'ether')} ETH
            {ethToInr && (
              <span> (₹{(ethers.utils.formatUnits(item.cost.toString(), 'ether') * ethToInr).toFixed(2)})</span>
            )}
          </h2>
          <hr />
          <h2>Overview</h2>
          <p>
            {item.description}
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Minima rem, iusto,
            consectetur inventore quod soluta quos qui assumenda aperiam, eveniet doloribus
            commodi error modi eaque! Iure repudiandae temporibus ex? Optio!
          </p>
        </div>

        <div className="product__order">
          <h1>
            {ethers.utils.formatUnits(item.cost.toString(), 'ether')} ETH
            {ethToInr && (
              <span> (₹{(ethers.utils.formatUnits(item.cost.toString(), 'ether') * ethToInr).toFixed(2)})</span>
            )}
          </h1>
          <p>
            FREE delivery <br />
            <strong>
              {new Date(Date.now() + 345600000).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </strong>
          </p>
          {item.stock > 0 ? <p>In Stock.</p> : <p>Out of Stock.</p>}

          {/* Address Input/Confirmation */}
          {addressSubmitted ? (
            <div className="address-confirmation">
              <p>Address Submitted Successfully!</p>
              <p>
                <strong>{addressDetails.fullName}</strong>
                <br />
                {addressDetails.addressLine1}
                <br />
                {addressDetails.addressLine2 && <>{addressDetails.addressLine2}<br /></>}
                {addressDetails.city}, {addressDetails.state}, {addressDetails.pincode}
              </p>
              <button onClick={() => setShowAddressPopup(true)}>Change Address</button>
            </div>
          ) : (
            <button
              className="product_Addr"
              onClick={() => setShowAddressPopup(true)}
            >
              Add Address
            </button>
          )}

          {showAddressPopup && (
            <div className="popup">
              <div className="popup__content">
                <h2>Enter Address</h2>
                <form
                  onSubmit={(e) =>
                    handleAddressSubmit(e, {
                      fullName: e.target.fullName.value,
                      addressLine1: e.target.addressLine1.value,
                      addressLine2: e.target.addressLine2.value || '',
                      city: e.target.city.value,
                      state: e.target.state.value,
                      pincode: e.target.pincode.value,
                    })
                  }
                >
                  <label>
                    Full Name:
                    <input type="text" name="fullName" placeholder="Enter your full name" required />
                  </label>
                  <label>
                    Address Line 1:
                    <input type="text" name="addressLine1" placeholder="Street, PO Box, etc." required />
                  </label>
                  <label>
                    Address Line 2:
                    <input type="text" name="addressLine2" placeholder="Apartment, Suite, Unit (optional)" />
                  </label>
                  <label>
                    City:
                    <input type="text" name="city" placeholder="City" required />
                  </label>
                  <label>
                    State:
                    <input type="text" name="state" placeholder="State" required />
                  </label>
                  <label>
                    Pincode:
                    <input type="text" name="pincode" placeholder="Enter pincode" required />
                  </label>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setShowAddressPopup(false)}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}

          <button className="product__buy" onClick={buyHandler}>
            Buy Now
          </button>

          <p><small>Ships from</small> OneCart</p>
          <p><small>Sold by</small> OneCart</p>

          {order && (
            <div className="product__bought">
              Item bought on <br />
              <strong>
                {new Date(Number(order.time.toString() + '000')).toLocaleDateString(
                  undefined,
                  {
                    weekday: 'long',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                  }
                )}
              </strong>
            </div>
          )}
        </div>

        <button onClick={togglePop} className="product__close">
          <img src={close} alt="Close" />
        </button>
      </div>

      {/* Purchase Success Popup */}
      {showSuccessPopup && (
        <div className="popup">
          <div className="popup__content">
            <h2>Purchase Successful!</h2>
            <p>Thank you for your order.</p>
            <button onClick={() => setShowSuccessPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
