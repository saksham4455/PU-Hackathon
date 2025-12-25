import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';
import { useState } from 'react';
import { Modal } from './Modal';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (modalType: string) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link
              to="/home"
              className="flex items-center space-x-2 text-2xl font-bold text-blue-400 hover:text-blue-300 transition mb-4"
            >
              <MapPin className="w-8 h-8" />
              <span>Improve My City</span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Empowering citizens to report, track, and resolve city issues together. 
              Make your neighborhood better, one issue at a time.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/home"
                  className="text-gray-300 hover:text-blue-400 transition text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/report"
                  className="text-gray-300 hover:text-blue-400 transition text-sm"
                >
                  Report Issue
                </Link>
              </li>
              <li>
                <Link
                  to="/my-complaints"
                  className="text-gray-300 hover:text-blue-400 transition text-sm"
                >
                  My Complaints
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="text-gray-300 hover:text-blue-400 transition text-sm"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => openModal('help')}
                  className="text-gray-300 hover:text-blue-400 transition text-sm text-left"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal('contact')}
                  className="text-gray-300 hover:text-blue-400 transition text-sm text-left"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal('privacy')}
                  className="text-gray-300 hover:text-blue-400 transition text-sm text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal('terms')}
                  className="text-gray-300 hover:text-blue-400 transition text-sm text-left"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 text-sm">support@improvemycity.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                <span className="text-gray-300 text-sm">
                  123 City Hall Plaza<br />
                  Your City, ST 12345
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Improve My City. All rights reserved.
            </div>
            <div className="flex items-center space-x-1 text-gray-400 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for our community</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={activeModal === 'help'} onClose={closeModal} title="Help Center">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How do I report an issue?</h4>
              <p className="text-gray-600 text-sm">
                Click on "Report Issue" in the navigation menu, fill out the form with details about the problem, 
                add photos if possible, and submit. You'll receive a tracking number to monitor progress.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How can I track my complaints?</h4>
              <p className="text-gray-600 text-sm">
                Visit "My Complaints" to see all your reported issues and their current status. 
                You'll get updates when the status changes.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What types of issues can I report?</h4>
              <p className="text-gray-600 text-sm">
                You can report potholes, street lighting issues, garbage collection problems, 
                water leaks, broken sidewalks, traffic signals, drainage issues, graffiti, 
                tree maintenance, noise complaints, parking violations, and more.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How long does it take to resolve issues?</h4>
              <p className="text-gray-600 text-sm">
                Resolution times vary by issue type and priority. Critical safety issues are addressed first, 
                typically within 24-48 hours. Other issues may take 1-2 weeks depending on complexity.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'contact'} onClose={closeModal} title="Contact Us">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Get in Touch</h3>
            <p className="text-gray-600 mb-4">
              Have a question or need assistance? We're here to help you make your city better.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Email Support</h4>
              <p className="text-gray-600 text-sm mb-2">
                For general inquiries and support:
              </p>
              <a href="mailto:support@improvemycity.com" className="text-blue-600 hover:text-blue-700">
                support@improvemycity.com
              </a>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Phone Support</h4>
              <p className="text-gray-600 text-sm mb-2">
                Monday - Friday, 9 AM - 5 PM:
              </p>
              <a href="tel:+15551234567" className="text-blue-600 hover:text-blue-700">
                +1 (555) 123-4567
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Office Hours</h4>
            <p className="text-gray-600 text-sm">
              Monday - Friday: 9:00 AM - 5:00 PM<br />
              Saturday: 10:00 AM - 2:00 PM<br />
              Sunday: Closed
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Response Time</h4>
            <p className="text-gray-600 text-sm">
              We typically respond to emails within 24 hours and phone calls are answered during business hours.
            </p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'privacy'} onClose={closeModal} title="Privacy Policy">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-4">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Information We Collect</h4>
                <p className="text-gray-600">
                  We collect information you provide when creating an account, reporting issues, 
                  and using our services. This includes your name, email address, phone number, 
                  and details about reported issues.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How We Use Your Information</h4>
                <p className="text-gray-600">
                  We use your information to process issue reports, communicate with you about 
                  your complaints, improve our services, and provide better city management.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Information Sharing</h4>
                <p className="text-gray-600">
                  We may share your information with city departments and contractors involved 
                  in resolving reported issues. We do not sell your personal information to third parties.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Data Security</h4>
                <p className="text-gray-600">
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Your Rights</h4>
                <p className="text-gray-600">
                  You have the right to access, update, or delete your personal information. 
                  Contact us at privacy@improvemycity.com for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'terms'} onClose={closeModal} title="Terms of Service">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-4">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Acceptance of Terms</h4>
                <p className="text-gray-600">
                  By using Improve My City, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our service.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">User Responsibilities</h4>
                <p className="text-gray-600">
                  Users are responsible for providing accurate information when reporting issues. 
                  False or misleading reports may result in account suspension.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Prohibited Uses</h4>
                <p className="text-gray-600">
                  You may not use our service for illegal activities, harassment, spam, 
                  or any purpose that violates applicable laws or regulations.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Service Availability</h4>
                <p className="text-gray-600">
                  We strive to maintain service availability but cannot guarantee uninterrupted access. 
                  We may temporarily suspend service for maintenance or updates.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Limitation of Liability</h4>
                <p className="text-gray-600">
                  Improve My City is not liable for any damages arising from the use of our service 
                  or the resolution of reported issues.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Changes to Terms</h4>
                <p className="text-gray-600">
                  We may update these terms at any time. Continued use of the service after changes 
                  constitutes acceptance of the new terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </footer>
  );
}
