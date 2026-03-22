import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/rootReducer';

import {
  getSalespersonsAction,
  addSalespersonAction,
} from '@/store/ducks/salespersons.ducks';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const vehicleTypes = ['Car', 'Bike', 'Truck'];

const SalespersonsPage = () => {

  const dispatch = useDispatch();

  const { data: salespersons } = useSelector(
    (state: RootState) => state.salespersons || { data: [] }
  );

  const user = useSelector((state: RootState) => state.auth.user);
  const companyCode = user?.CompanyCode || 'DEFAULT_COMPANY';

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<any>({
    commissionType: '',
    commissionValue: '',
    vehicle: '',
    full_name: '',
    mobile_number: '',
    email: '',
    branch_id: '',
    city: '',
  });

  useEffect(() => {
    if (companyCode) {
      dispatch(getSalespersonsAction(companyCode));
    }
  }, [dispatch, companyCode]);

  const filtered = (salespersons || []).filter((d: any) =>
    (d.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

 const handleSave = () => {
  if (!form.full_name?.trim()) {
    alert('Full name is required');
    return;
  }

  if (!/^\d{10}$/.test(form.mobile_number)) {
    alert('Mobile number must be exactly 10 digits');
    return;
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    alert('Invalid email address');
    return;
  }

  if (!(form.city || form.branch_id)) {
    alert('Branch is required');
    return;
  }

  if (!form.commissionType) {
    alert('Commission type is required');
    return;
  }

  if (!form.commissionValue) {
    alert('Commission value is required');
    return;
  }

  if (
    form.commissionType === 'percentage' &&
    !form.vehicle
  ) {
    alert('Vehicle type is required for percentage commission');
    return;
  }

  const payload = {
    ...form,
    branch_id: form.city || form.branch_id || '',
    company_id: companyCode,
    commissionValue: Number(form.commissionValue || 0),
    vehicle: form.commissionType === 'percentage' ? form.vehicle : '',
  };

  dispatch(
    addSalespersonAction(payload, companyCode, () => {
      setOpen(false);
      setForm({});
    })
  );
};

  const renderCommission = (item: any) => {

    if (item.commissionType === 'fixed') {
      return `₹ ${item.commissionValue}`;
    }

    if (item.commissionType === 'percentage') {
      return `${item.commissionValue}% (${item.vehicle})`;
    }

    return '-';
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-black">Sales Team</h1>
          <p className="text-xs text-muted-foreground">Personnel Management</p>
        </div>

        <div className="flex gap-3">

          <div className="flex items-center gap-2 border rounded-xl px-4 h-10">
            <Search className="w-4 h-4" />
            <input
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none"
            />
          </div>

          <Button
            onClick={() => {
              setForm({
                commissionType: '',
                commissionValue: '',
                vehicle: '',
                full_name: '',
                mobile_number: '',
                email: '',
                branch_id: '',
                city: '',
              });
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Member
          </Button>

        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {filtered.map((item: any) => (

          <Card key={item._id} className="rounded-2xl shadow">

            <CardContent className="p-4 space-y-2">

              <div className="flex justify-between">

                <div>
                  <h3 className="font-semibold text-lg">
                    {item.full_name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {item.branch_id}
                  </p>
                </div>

                <Badge>ACTIVE</Badge>

              </div>

              <div className="text-sm space-y-1">

                <p>
                  <b>Mobile:</b> {item.mobile_number}
                </p>

                <p>
                  <b>Email:</b> {item.email}
                </p>

                <p>
                  <b>Commission:</b> {renderCommission(item)}
                </p>

              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setForm(item);
                  setOpen(true);
                }}
              >
                Edit
              </Button>

            </CardContent>

          </Card>

        ))}

      </div>

      {/* ADD / EDIT DIALOG */}

      <Dialog open={open} onOpenChange={setOpen}>

        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Add Salesperson
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">

            <Input
              placeholder="Name"
              value={form.full_name || ''}
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
            />

            <Input
              placeholder="Branch / City"
              value={form.city || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  city: e.target.value,
                  branch_id: e.target.value,
                })
              }
            />

            <Input
              placeholder="Mobile"
              value={form.mobile_number || ''}
              onChange={(e) =>
                setForm({ ...form, mobile_number: e.target.value })
              }
            />

            <Input
              placeholder="Email"
              value={form.email || ''}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            {/* COMMISSION TYPE */}

            <Select
              value={form.commissionType}
              onValueChange={(val) =>
                setForm({ ...form, commissionType: val })
              }
            >

              <SelectTrigger>
                <SelectValue placeholder="Select Commission Type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>

            </Select>

            {/* VEHICLE TYPE */}

            {form.commissionType === 'percentage' && (

              <Select
                value={form.vehicle}
                onValueChange={(val) =>
                  setForm({ ...form, vehicle: val })
                }
              >

                <SelectTrigger>
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>

                <SelectContent>

                  {vehicleTypes.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}

                </SelectContent>

              </Select>

            )}

            {/* COMMISSION VALUE */}

            <Input
              type="number"
              placeholder={
                form.commissionType === 'fixed'
                  ? 'Enter Amount'
                  : 'Enter %'
              }
              value={form.commissionValue || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  commissionValue: e.target.value,
                })
              }
            />

            <Button className="w-full" onClick={handleSave}>
              Save
            </Button>

          </div>

        </DialogContent>

      </Dialog>

    </div>
  );
};

export default SalespersonsPage;